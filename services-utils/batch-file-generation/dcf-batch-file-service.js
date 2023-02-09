'use strict';

const lodash = require('lodash');
const loggerUtils = require('../../sharedLib/common/logger-utils');
const SSConstants = require('../../sharedLib/common/shared-systems-constants');
const PostgresSQLService = require('../../sharedLib/db/postgre-sql-service');
const PopulateBatchFileNameSerivce = require('./populate-batch-file-name-service');
const BuildHeaderRecordService = require('./build-header-record-service');
const BuildTrailerRecordService = require('./build-trailer-record-service');
const BuildDCFBodyDataSerivce = require('./build-dcf-body-data-service')
const BatchFileToDCService = require('./batch-file-to-dc-service');
const DCFBatchFileToRCSerivce = require('./dcf-batch-file-to-rc-service');
const GenerateAuditEventSerivce = require('../../sharedLib/common/generate-auidt-event');
const GenerateNotificationSerivce = require('../../sharedLib/common/generate-notification-event');
const InsertDataService = require('./build-insert-data-service');
const CalcFileSize = require('../../sharedLib/common/calc-file-size');

const clsName = 'DCFBatchFileSerivce';
const SUCCESS = 'Success';
const FAILURE = 'Failure';
const dcfBatchFileNames = process.env.dcf_batch_filenames_to_generate;
const dcfSSMBatchFilePath = process.env.dcf_ssm_batch_file_delivery_path;
const refSqlToGetDCFBatchData = process.env.ref_sql_to_get_dcf_data_for_batch;
const refSqlToUptDCFBatchDataStatus = process.env.ref_sql_to_upt_dcf_batch_status;
//const refSqlToUptDCFBatchDataInprocess = process.env.ref_sql_to_set_dcf_batch_file_data_inprocess;
//const refSqlToUptDCFBatchDataComplete = process.env.ref_sql_to_set_dcf_batch_file_data_complete;
const dcfBatchSuccessNotifyType = 'DCF_FLATFILE_GEN_SUCCESS';
const dcfBatchFailureNotifyType = 'ESMD_GENERIC_ERROR';
let instance = null;

class DCFBatchFileSerivce {

    static getInstance(){
        if(!instance){
            instance = new DCFBatchFileSerivce();
        }
        return instance;
    }

    async generateDCFBatchFile(msgData, reqQueueDetails, batchFileFor, dateTimeData, pool) {

        const logParams = {};
        const logger = loggerUtils.customLogger(clsName, logParams);
        try {
            const dateTimeDataArray = dateTimeData.split('^');
            const formattedDateTime = dateTimeDataArray[0];
            const dateToday = dateTimeDataArray[1];
            const fileNameDate = dateTimeDataArray[2];
            const batchData = await PostgresSQLService.getInstance().excSelectQuery(refSqlToGetDCFBatchData, logParams, pool);
            if ( !(lodash.isEmpty(batchData))) {
                logger.info(`generateDCFBatchFile,batchData.length: ${batchData.length}`);
                let glblUniqId = 'null';
                let csvFileName = 'null';
                for await (const eachRecord of batchData) {
                    glblUniqId = eachRecord.glbl_uniq_id;
                    csvFileName = eachRecord.fil_name;
                    logger.info(`generateDCFBatchFile,eachRecord: ${JSON.stringify(eachRecord)} globalTransID: ${glblUniqId}`);
                    break;
                }
                //Updating the status to 507 for all the records available in batchData
                let refSqlToUptDCFBatchDataInprocess = refSqlToUptDCFBatchDataStatus;
                refSqlToUptDCFBatchDataInprocess = refSqlToUptDCFBatchDataInprocess.replace('$1', SSConstants.INPROCESS);
                refSqlToUptDCFBatchDataInprocess = refSqlToUptDCFBatchDataInprocess.replace('$2', SSConstants.INITAIL);
                refSqlToUptDCFBatchDataInprocess = refSqlToUptDCFBatchDataInprocess.replace('$3', glblUniqId);
                const uptInprocessStatusRes = await PostgresSQLService.getInstance().excUpdateQuery(refSqlToUptDCFBatchDataInprocess, logParams, pool);
                logger.info(`generateDCFBatchFile,uptInprocessStatusRes: ${JSON.stringify(uptInprocessStatusRes)} records updated Successfully`);
                const s3ConfigInfo = {
                    configfolder: process.env.s3dcfconfigfolder,
                    headerobj: process.env.headerobj,
                    trailerobj: process.env.trailerobj,
                    bodyobj: process.env.bodyobj,
                    headerattributes: process.env.dcf_header_data,
                    trailerattributes: process.env.dcf_trailer_data,
                    bodyattributes: process.env.dcf_body_data
                }
                //meta data obj update - start
                let noOfRecords = batchData.length;
                noOfRecords = noOfRecords.toString().padStart(7, '0')
                msgData.no_of_records = noOfRecords;
                msgData.batch_cycle_date = formattedDateTime;
                //meta data obj update - End
                logger.info(`generateDCFBatchFile,s3ConfigInfo: ${JSON.stringify(s3ConfigInfo)} msgData: ${JSON.stringify(msgData)}`);
                const headerRecord = await BuildHeaderRecordService.getInstance().buildHeaderRecord(msgData, s3ConfigInfo);
                const trailerRecord = await BuildTrailerRecordService.getInstance().buildTrailerRecord(msgData, s3ConfigInfo);
                logger.info(`generateDCFBatchFile,headerObj: ${headerRecord.length} trailerObj: ${trailerRecord.length} dateToday: ${dateToday} formattedDateTime: ${formattedDateTime} batchFileFor: ${batchFileFor}`);
                msgData.hdr_obj = headerRecord
                msgData.trlr_obj = trailerRecord
                msgData.glbl_uniq_id = glblUniqId;
                const bodyData = await BuildDCFBodyDataSerivce.getInstance().buildDCFBodyInfo(glblUniqId, batchData, s3ConfigInfo);
                logger.info(`generateDCFBatchFile,bodyData.length: ${bodyData.length}`);

                const reqDataToGenBatchFile = {
                    headerdata: headerRecord,
                    bodydata: bodyData,
                    trailerdata: trailerRecord,
                    formatteddatetime: formattedDateTime,
                    datetoday: dateToday,
                    filenamedate: fileNameDate,
                    batchfilefor: batchFileFor,
                    globaltransid: glblUniqId
                }
                if ( dcfBatchFileNames !== undefined && dcfBatchFileNames !== null) {
                    const dcfBatchFileNamesArray = dcfBatchFileNames.split('^');
                    logger.info(`generateDCFBatchFile,dcfBatchFileNamesArray.length: ${dcfBatchFileNamesArray.length} dcfBatchFileNames: ${dcfBatchFileNames}`);
                    let i = 0;
                    let sourceBatchFileName = '';
                    let batchFileCopyflag = false;
                    let batchFileGenSuccessFlag = true;
                    let batchFileNameWithDir = 'null';
                    let batchFileName = 'null';
                    
                    let reqAuditEventData = {
                        auditeventdata: process.env.ssm_batch_file_gen_success_audit_event,
                        auditqueueurl: reqQueueDetails.auditqueueurl,
                        notifyqueueurl: reqQueueDetails.notificationqueueurl,
                        csvfilename: csvFileName
                    }
                    //Generating multiple batch files for different data centers & different batch files for RC's related to dept id '17'
                    for await (let eachFileName of dcfBatchFileNamesArray) {
                        logger.info(`generateDCFBatchFile,eachFileName: ${eachFileName}`);
                        if (eachFileName.indexOf('RC~') > -1) {
                            let dcfBatchFileNameToRCArr = eachFileName.split('~');
                            let dcfBatchfileName = dcfBatchFileNameToRCArr[1];
                            const dcfBatchFileToRCSerivce = await DCFBatchFileToRCSerivce.getInstance();
                            const dcfBatchFiletoRCRes = await dcfBatchFileToRCSerivce.generateDCFBatchToRCs(reqDataToGenBatchFile, reqAuditEventData, dcfBatchfileName, batchFileCopyflag, sourceBatchFileName, msgData, pool);
                            logger.info(`generateDCFBatchFile,dcfBatchFiletoRCRes: ${JSON.stringify(dcfBatchFiletoRCRes)}`);

                            if ( dcfBatchFiletoRCRes === SUCCESS ) {
                                i = i + 1;
                            } else {
                                batchFileGenSuccessFlag = false;
                            }
                            
                        } else {
                            //ESMA-3857 - Start
                            let dataCenterID = msgData.data_cntr_id;
                            let dcfBatchfileName = eachFileName;
                            if (eachFileName.indexOf('~') > -1) {
                                let fileNameArray = eachFileName.split('~');
                                dataCenterID = fileNameArray[0];
                                dcfBatchfileName = fileNameArray[1];
                            }
                            //let batchFileNamesRes = await PopulateBatchFileNameSerivce.getInstance().populateBatchFileName (eachFileName, formattedDateTime, fileNameDate, batchFileFor, dcfSSMBatchFilePath, dataCenterID );
                            let batchFileNamesRes = await PopulateBatchFileNameSerivce.getInstance().populateBatchFileName (dcfBatchfileName, formattedDateTime, fileNameDate, batchFileFor, dcfSSMBatchFilePath, dataCenterID );
                            //ESMA-3857 - End
                            batchFileNameWithDir = batchFileNamesRes.batchfilenamewithdir;
                            batchFileName = batchFileNamesRes.batchfilename;
                            let RCMailBox = 'null';
                            let batchFileToDCService = await BatchFileToDCService.getInstance();
                            let batchStatus = await batchFileToDCService.batchFileToDC(reqDataToGenBatchFile, batchFileNameWithDir, batchFileCopyflag, sourceBatchFileName, RCMailBox);
                            logger.info(`generateDCFBatchFile,batchStatus: ${batchStatus} for batchFileName: ${batchFileNameWithDir}`);
                            msgData.fil_name = batchFileName;
                            msgData.data_cntr_id = dataCenterID //ESMA-3857
                            reqAuditEventData.flatfilename = batchFileName; // Adding file name in Audit event data
                            reqAuditEventData.batchfilefor = batchFileFor;
                            if ( batchStatus === SUCCESS ) {
                                //Success Audit event 
                                let auditEventStatus = await GenerateAuditEventSerivce.getInstance().generateAuditEvent ( glblUniqId, reqAuditEventData );

                                //Success Notification event
                                reqAuditEventData.notificationtype = dcfBatchSuccessNotifyType;
                                let sendNotifyRes = await GenerateNotificationSerivce.getInstance().generateNotificationEvent(glblUniqId, reqAuditEventData);
                                logger.info(`generateDCFBatchFile,auditEventStatus: ${auditEventStatus} sendNotifyRes: ${sendNotifyRes} for batchFileName: ${batchFileName}`);

                                let batchFileSize = await CalcFileSize.calcBatchFileSize (batchFileNameWithDir, logger)
                                logger.info(`generateSRVCBatchFile,batchFileSize: ${batchFileSize}`);
                                msgData.filesize = batchFileSize;
                                if ( i === 0 ) {
                                    sourceBatchFileName = batchFileNameWithDir;
                                    batchFileCopyflag = true;
                                }
                                const insertSysBatchJobRes = await InsertDataService.getInstance().buildAndInsertSysBatchRec(glblUniqId, msgData, pool)
                                logger.info(`generateDCFBatchFile,insertSysBatchJobRes: ${insertSysBatchJobRes} for batchFileName: ${batchFileName}`);
                                i += 1
                            } else {
                                batchFileGenSuccessFlag = false;
                            }
                        }
                        logger.debug(`generateDCFBatchFile, i: ${i} dcfBatchFileNamesArray.length: ${dcfBatchFileNamesArray.length}`);
                        if ( i === dcfBatchFileNamesArray.length ) {
                            //Updating the status to 508 for all the records available in batchData after successfully generated the batch files
                            let refSqlToUptDCFBatchDataComplete = refSqlToUptDCFBatchDataStatus;
                            refSqlToUptDCFBatchDataComplete = refSqlToUptDCFBatchDataComplete.replace('$1', SSConstants.COMPLETED);
                            refSqlToUptDCFBatchDataComplete = refSqlToUptDCFBatchDataComplete.replace('$2', SSConstants.INPROCESS);
                            refSqlToUptDCFBatchDataComplete = refSqlToUptDCFBatchDataComplete.replace('$3', glblUniqId);
                            const uptCompleteStatusRes = await PostgresSQLService.getInstance().excUpdateQuery(refSqlToUptDCFBatchDataComplete, logParams, pool);
                            logger.info(`generateDCFBatchFile,uptCompleteStatusRes: ${JSON.stringify(uptCompleteStatusRes)} records updated Successfully`);

                            let uptSubmsnTransStatusSql = process.env.ref_sql_to_upt_status_in_submsn_trans_for_dcf
                            if (uptSubmsnTransStatusSql) {
                                uptSubmsnTransStatusSql = uptSubmsnTransStatusSql.replace('$1', glblUniqId)
                                const uptSubmsnTransStatusRes = await PostgresSQLService.getInstance().excUpdateQuery(uptSubmsnTransStatusSql, logParams, pool);
                                logger.info(`generateDCFBatchFile,uptSubmsnTransStatusRes: ${JSON.stringify(uptSubmsnTransStatusRes)} records updated Successfully`);
                            }
                        
                            return SUCCESS;
                        } else {
                            if (!batchFileGenSuccessFlag) {
                                //Updating the status back to 501 for all the records available in batchData if it fails to generate Batch file
                                //Failure Audit event
                                reqAuditEventData.auditeventdata = process.env.ssm_batch_file_gen_failure_audit_event;
                                let auditEventStatus = await GenerateAuditEventSerivce.getInstance().generateAuditEvent ( glblUniqId, reqAuditEventData );

                                //Failure Notification event
                                reqAuditEventData.notificationtype = dcfBatchFailureNotifyType;
                                let sendNotifyRes = await GenerateNotificationSerivce.getInstance().generateNotificationEvent(glblUniqId, reqAuditEventData);
                                logger.info(`generateDCFBatchFile,auditEventStatus: ${auditEventStatus} sendNotifyRes: ${sendNotifyRes}`);
                                const updateInitialStatusSql = process.env.ref_sql_to_set_dcf_batch_file_data_initial_status;
                                let refSqlToUptDCFBatchDataInitial = refSqlToUptDCFBatchDataStatus;
                                refSqlToUptDCFBatchDataInitial = refSqlToUptDCFBatchDataInitial.replace('$1', SSConstants.INITAIL);
                                refSqlToUptDCFBatchDataInitial = refSqlToUptDCFBatchDataInitial.replace('$2', SSConstants.INPROCESS);
                                refSqlToUptDCFBatchDataInitial = refSqlToUptDCFBatchDataInitial.replace('$3', glblUniqId);
                                const uptInitialStatusRes = await PostgresSQLService.getInstance().excUpdateQuery(updateInitialStatusSql, logParams, pool);
                                logger.info(`generateDCFBatchFile,uptInitialStatusRes: ${JSON.stringify(uptInitialStatusRes)} records updated Successfully`);
                                return FAILURE;
                            }
                        }
                    }
                } else {
                    logger.error(`generateDCFBatchFile,dcfBatchFileNames not defiend AWS paramaeter store: ${dcfBatchFileNames}`);
                }
            } else {
                logger.info('generateDCFBatchFile,DCF Data is NOt available to generate Batchfile');
                return SUCCESS;
            }

        } catch (err) {
            logger.error(`generateDCFBatchFile,ERROR: ${err.stack}`);
            throw Error(`generateDCFBatchFile, ERROR in Catch: ${JSON.stringify(err)}`);
        }
        
    }
  
}

module.exports = DCFBatchFileSerivce;