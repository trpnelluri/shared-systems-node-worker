'use strict';

const lodash = require('lodash');
const loggerUtils = require('../../sharedLib/common/logger-utils');
const PostgresSQLService = require('../../sharedLib/db/postgre-sql-service');
const PopulateBatchFileNameSerivce = require('./populate-batch-file-name-service');
const BuildHeaderRecordService = require('./build-header-record-service');
const BuildTrailerRecordService = require('./build-trailer-record-service');
const BuildSRVCBodyDataSerivce = require('./build-srvc-body-data-service');
const BatchFileToDCService = require('./batch-file-to-dc-service');
const SRVCBatchFileToRCSerivce = require('./srvc-batch-file-to-rc-service');
const GenerateAuditEventSerivce = require('../../sharedLib/common/generate-auidt-event');
const InsertDataService = require('./build-insert-data-service');
const CalcFileSize = require('../../sharedLib/common/calc-file-size');

const clsName = 'SRVCBatchFileSerivce';
let instance = null;
const srvcBatchFilePath = process.env.srvc_batch_file_delivary_path;
const refSqlToGetSRVCData = process.env.ref_sql_to_get_srvc_data_for_batch;
const SUCCESS = 'Success';
//const FAILURE = 'Failure';

class SRVCBatchFileSerivce {

    static getInstance(){
        if(!instance){
            instance = new SRVCBatchFileSerivce();
        }
        return instance;
    }

    async generateSRVCBatchFile(msgData, reqQueueDetails, batchFileFor, dateTimeData, pool) {
        let logParams = {};
        let glblUniqId = await _generateNewGuid (logParams, pool);
        logParams = { globaltransid: glblUniqId };
        let logger = loggerUtils.customLogger(clsName, logParams);
        try {
            const dateTimeDataArray = dateTimeData.split('^');
            const formattedDateTime = dateTimeDataArray[0];
            const dateToday = dateTimeDataArray[1];
            const fileNameDate = dateTimeDataArray[2];
            logger.info(`generateSRVCBatchFile,msgData: ${JSON.stringify(msgData)} batchFileFor: ${batchFileFor} dateTimeData: ${dateTimeData}`);
            const batchData = await PostgresSQLService.getInstance().excSelectQuery(refSqlToGetSRVCData, logParams, pool);
            if ( !(lodash.isEmpty(batchData))) {
                logger.info(`generateSRVCBatchFile,inside if ${batchData.length }`);
                const s3ConfigInfo = {
                    configfolder: process.env.s3srvcconfigfolder,
                    headerobj: process.env.headerobj,
                    trailerobj: process.env.trailerobj,
                    bodyobj: process.env.bodyobj,
                    headerattributes: process.env.srvc_header_data,
                    trailerattributes: process.env.srvc_trailer_data,
                    bodyattributes: process.env.srvc_body_data,
                }
                //meta data obj update - start
                let noOfRecords = batchData.length;
                noOfRecords = noOfRecords.toString().padStart(7, '0')
                msgData.no_of_records = noOfRecords;
                msgData.batch_cycle_date = formattedDateTime;
                //meta data obj update - End
                //updating the dataCenterID
                let dataCenterID = msgData.data_cntr_id;
                dataCenterID = dataCenterID.toString().padStart(3, '0');
                msgData.data_cntr_id_pad = dataCenterID;
                msgData.full_dc_name = msgData.data_cntr_name + dataCenterID;
                //meta data obj update - End
                let populateBatchFileNameSerivce = await PopulateBatchFileNameSerivce.getInstance();
                let batchFileNameRes = await populateBatchFileNameSerivce.populateBatchFileName (msgData.fil_name_tmplt, formattedDateTime, fileNameDate, batchFileFor, srvcBatchFilePath, msgData.full_dc_name);
                logger.info(`generateSRVCBatchFile,inside if ${JSON.stringify(batchFileNameRes)}`);
                const batchFileNameWithDir = batchFileNameRes.batchfilenamewithdir;
                const batchFileName = batchFileNameRes.batchfilename;
                const headerRecord = await BuildHeaderRecordService.getInstance().buildHeaderRecord(msgData, s3ConfigInfo);
                const trailerRecord = await BuildTrailerRecordService.getInstance().buildTrailerRecord(msgData, s3ConfigInfo);
                logger.info(`generateSRVCBatchFile,headerObj: ${headerRecord.length} trailerObj: ${trailerRecord.length} dateToday: ${dateToday} formattedDateTime: ${formattedDateTime} batchFileFor: ${batchFileFor}`);
                //meta data obj update to sys_batch_job data - start
                msgData.fil_name = batchFileName;
                msgData.hdr_obj = headerRecord
                msgData.trlr_obj = trailerRecord
                msgData.glbl_uniq_id = glblUniqId;
                //meta data obj update to sys_batch_job data - End
                const bodyData = await BuildSRVCBodyDataSerivce.getInstance().buildSRVCBodyInfo(glblUniqId, batchData, s3ConfigInfo);
                logger.info(`generateSRVCBatchFile,bodyData.length: ${bodyData.length} bodyData: ${JSON.stringify(bodyData)}`);

                let reqDataToGenBatchFile = {
                    headerdata: headerRecord,
                    bodydata: bodyData,
                    trailerdata: trailerRecord,
                    formatteddatetime: formattedDateTime,
                    datetoday: dateToday,
                    filenamedate: fileNameDate,
                    batchfilefor: batchFileFor,
                    globaltransid: glblUniqId
                }
                
                let reqAuditEventData = {
                    auditeventdata: process.env.ssm_batch_file_gen_success_audit_event,
                    auditqueueurl: reqQueueDetails.auditqueueurl,
                    notifyqueueurl: reqQueueDetails.notificationqueueurl,
                    flatfilename:  batchFileName, // Adding file name in Audit event data
                    batchfilefor: batchFileFor
                }

                let batchFileCopyflag = false;
                let sourceBatchFileName = '';
                let RCMailBox = 'null';
                const batchFileToDCService = await BatchFileToDCService.getInstance();
                const batchStatus = await batchFileToDCService.batchFileToDC(reqDataToGenBatchFile, batchFileNameWithDir, batchFileCopyflag, sourceBatchFileName, RCMailBox );
                logger.info(`generateSRVCBatchFile,batchStatus: ${batchStatus}`);
                if ( batchStatus === SUCCESS ) {
                    let auditEventStatus = await GenerateAuditEventSerivce.getInstance().generateAuditEvent ( glblUniqId, reqAuditEventData );
                    logger.info(`generateSRVCBatchFile,auditEventStatus: ${auditEventStatus} for batchFileName: ${batchFileName}`);
                    batchFileCopyflag = true;
                    sourceBatchFileName = batchFileNameWithDir;
                    const batchFileSize = await CalcFileSize.calcBatchFileSize (sourceBatchFileName, logger)
                    logger.info(`generateSRVCBatchFile,batchFileSize: ${batchFileSize}`);
                    msgData.filesize = batchFileSize;
                    const insertSysBatchJobRes = await InsertDataService.getInstance().buildAndInsertSysBatchRec(glblUniqId, msgData, pool)
                    logger.info(`generateSRVCBatchFile,insertSysBatchJobRes: ${insertSysBatchJobRes} for batchFileName: ${batchFileName}`);
                    const srvcBatchFiletoRCRes = await SRVCBatchFileToRCSerivce.getInstance().generateSRVCBatchfileToRC(reqDataToGenBatchFile, reqAuditEventData, batchFileCopyflag, sourceBatchFileName, msgData, pool);
                    logger.info(`generateSRVCBatchFile,srvcBatchFiletoRCRes: ${srvcBatchFiletoRCRes}`);
                    if (!srvcBatchFiletoRCRes){  //NON MAC RC's Batch file process Fails
                        reqAuditEventData.auditeventdata = process.env.ssm_batch_file_gen_failure_audit_event;
                        let auditEventStatus = await GenerateAuditEventSerivce.getInstance().generateAuditEvent ( glblUniqId, reqAuditEventData );
                        logger.info(`generateSRVCBatchFile,auditEventStatus: ${auditEventStatus}`);
                    }
                    return srvcBatchFiletoRCRes;
                } else {
                    reqAuditEventData.auditeventdata = process.env.ssm_batch_file_gen_failure_audit_event
                    let auditEventStatus = await GenerateAuditEventSerivce.getInstance().generateAuditEvent ( glblUniqId, reqAuditEventData )
                    logger.info(`generateSRVCBatchFile,auditEventStatus: ${auditEventStatus}`)
                }
            }

        }catch (err) {
            logger.error(`generateSRVCBatchFile,ERROR: ${err.stack}` );
            throw Error(`generateSRVCBatchFile, ERROR in Catch: ${JSON.stringify(err)}`);
        }
    }

}

async function _generateNewGuid (logParams, pool) {
    let logger = loggerUtils.customLogger(clsName, logParams);
    try {
        let queryToGenGUID = process.env.ref_sql_to_get_new_guid;
        const guid = await PostgresSQLService.getInstance().getNewGUID (queryToGenGUID, logParams, pool);
        return guid;
    } catch (err){
        logger.error(`generateSRVCBatchFile,ERROR: ${err.stack}` );
    }
  
}

module.exports = SRVCBatchFileSerivce;