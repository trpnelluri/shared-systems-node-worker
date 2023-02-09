'use strict';
const lodash = require('lodash');
const loggerUtils = require('../../sharedLib/common/logger-utils');
const SSConstants = require('../../sharedLib/common/shared-systems-constants');
const PostgresSQLService = require('../../sharedLib/db/postgre-sql-service');
const PopulateBatchFileNameSerivce = require('./populate-batch-file-name-service');
const BuildHeaderRecordService = require('./build-header-record-service');
const BuildTrailerRecordService = require('./build-trailer-record-service');
const BatchFileToDCService = require('./batch-file-to-dc-service');
const BuildBulkAuditEventSerivce = require('../../sharedLib/common/build-audit-event-arry-service')

const clsName = 'PAReqBatchFileSerivce';
const SUCCESS = 'Success';
//const maxNoOfUptRecs = 20;
const paReqBatchFilePath = process.env.pa_req_ssm_batch_file_delivery_path;
let refSqltoGetBatchData = process.env.ref_sql_pa_req_batch_data;
//let refSqltoUptFileName = process.env.ref_sql_to_upt_file_name_in_sub_trans;
let instance = null;
//let refSqltoGetBatchData = process.env.ref_sql_to_get_data_for_batch;

class PAReqBatchFileSerivce {

    static getInstance(){
        if(!instance){
            instance = new PAReqBatchFileSerivce();
        }
        return instance;
    }

    async generatePAReqBatchFile(msgData, reqQueueDetails, batchFileFor, dateTimeData, pool) {

        const logParams = {};
        const logger = loggerUtils.customLogger(clsName, logParams);

        try {
            const recordTypeIndi = msgData.clm_type_ind;
            const msgDataCenterID = msgData.data_cntr_id;
            const dateTimeDataArray = dateTimeData.split('^');
            const formattedDateTime = dateTimeDataArray[0];
            const dateToday = dateTimeDataArray[1];
            const fileNameDate = dateTimeDataArray[2];
            refSqltoGetBatchData = refSqltoGetBatchData.replace('$1', 'YYYYMMDD');
            refSqltoGetBatchData = refSqltoGetBatchData.replace('$2', recordTypeIndi);
            refSqltoGetBatchData = refSqltoGetBatchData.replace('$3', msgDataCenterID);
            
            const batchData = await PostgresSQLService.getInstance().excSelectQuery(refSqltoGetBatchData, logParams, pool);

            if ( !(lodash.isEmpty(batchData))) {
                logger.info(`generatePAReqBatchFile,batchData.length: ${batchData.length}`);
                //Updating the status to 507 for all the records available in batchData
                let refSqlToUptPaReqBatchStatus = process.env.ref_sql_to_upt_pa_req_batch_status;
                refSqlToUptPaReqBatchStatus = refSqlToUptPaReqBatchStatus.replace('$1', SSConstants.INPROCESS);
                refSqlToUptPaReqBatchStatus = refSqlToUptPaReqBatchStatus.replace('$2', SSConstants.INITAIL);
                refSqlToUptPaReqBatchStatus = refSqlToUptPaReqBatchStatus.replace('$3', recordTypeIndi);
                refSqlToUptPaReqBatchStatus = refSqlToUptPaReqBatchStatus.replace('$4', msgDataCenterID);
                const uptInprocessStatusRes = await PostgresSQLService.getInstance().excUpdateQuery(refSqlToUptPaReqBatchStatus, logParams, pool);
                logger.info(`generatePAReqBatchFile,uptInprocessStatusRes: ${JSON.stringify(uptInprocessStatusRes)} records updated Successfully`);
                const s3ConfigInfo = {
                    configfolder: process.env.pareqconfigfolder,
                    headerobj: process.env.headerobj,
                    trailerobj: process.env.trailerobj,
                    headerattributes: process.env.pa_req_header_data,
                    trailerattributes: process.env.pa_req_trailer_data
                }
                //NOTE: The following 'no_of_records' attribute value will be used in trailer Object
                //meta data obj update - start
                let noOfRecords = batchData.length;
                noOfRecords = noOfRecords.toString().padStart(7, '0')
                msgData.no_of_records = noOfRecords;
                msgData.batch_cycle_date = formattedDateTime;
                //updating the dataCenterID
                let dataCenterID = msgDataCenterID;
                dataCenterID = dataCenterID.toString().padStart(3, '0');
                msgData.data_cntr_id_pad = dataCenterID;
                msgData.full_dc_name = msgData.data_cntr_name + dataCenterID;
                //meta data obj update - End
                    
                let populateBatchFileNameSerivce = await PopulateBatchFileNameSerivce.getInstance();
                let batchFileNameRes = await populateBatchFileNameSerivce.populateBatchFileName (msgData.fil_name_tmplt, formattedDateTime, fileNameDate, batchFileFor, paReqBatchFilePath, msgData.full_dc_name);
                const batchFileNameWithDir = batchFileNameRes.batchfilenamewithdir;
                const batchFileName = batchFileNameRes.batchfilename //USED In Audit event
                const headerRecord = await BuildHeaderRecordService.getInstance().buildHeaderRecord(msgData, s3ConfigInfo );
                const trailerRecord = await BuildTrailerRecordService.getInstance().buildTrailerRecord(msgData, s3ConfigInfo);
                logger.info(`generatePAReqBatchFile,batchFileName: ${batchFileName} headerObj: ${headerRecord.length} trailerObj: ${trailerRecord.length} dateToday: ${dateToday}`);
                const reqDataToGenBatchFile = {
                    headerdata: headerRecord,
                    bodydata: batchData,
                    trailerdata: trailerRecord,
                    formatteddatetime: formattedDateTime,
                    datetoday: dateToday,
                    batchfilefor: batchFileFor
                }
                //NOTE: The following 2 parameters will be used to copy the same batch file to differnt receipiant 
                let batchFileCopyflag = false;
                let sourceBatchFileName = '';
                let RCMailBox = 'null';
                const batchFileToDCService = await BatchFileToDCService.getInstance();
                const batchStatus = await batchFileToDCService.batchFileToDC(reqDataToGenBatchFile, batchFileNameWithDir, batchFileCopyflag, sourceBatchFileName, RCMailBox);
                logger.info(`generatePAReqBatchFile,batchStatus: ${batchStatus}`);
                refSqlToUptPaReqBatchStatus = process.env.ref_sql_to_upt_pa_req_batch_status;
                let reqAuditEventData = {
                    auditqueueurl: reqQueueDetails.auditqueueurl,
                    notifyqueueurl: reqQueueDetails.notificationqueueurl,
                    flatfilename: batchFileName,
                    processeddata: batchData
                }
                if ( batchStatus === SUCCESS ) {
                    //TBD Audit Event for each transcationID File Name also we need to include
                    reqAuditEventData.auditeventdata = process.env.ssm_batch_file_gen_success_audit_event;
                    const successAuditEventRes = await BuildBulkAuditEventSerivce.getInstance().buildBulkAuditEventArry(null, reqAuditEventData)
                    logger.info(`generatePAReqBatchFile,successAuditEventRes: ${successAuditEventRes}`);

                    //Subbmission trans table need to add the file Name
                    //TBD will enable the follwoing two lines once if Mule worker ready.
                    //const fileNameUptinSubTrans = await _uptFileNameInSubmsnTrans(logger, batchData, batchFileName, pool);
                    //logger.info(`generatePAReqBatchFile,fileNameUptinSubTrans: ${fileNameUptinSubTrans}`);

                    //updating the status to complete the batch file i.e 508 
                    refSqlToUptPaReqBatchStatus = refSqlToUptPaReqBatchStatus.replace('$1', SSConstants.COMPLETED);
                    refSqlToUptPaReqBatchStatus = refSqlToUptPaReqBatchStatus.replace('$2', SSConstants.INPROCESS);
                    refSqlToUptPaReqBatchStatus = refSqlToUptPaReqBatchStatus.replace('$3', recordTypeIndi);
                    refSqlToUptPaReqBatchStatus = refSqlToUptPaReqBatchStatus.replace('$4', msgDataCenterID);
                    const uptCompleteStatusRes = await PostgresSQLService.getInstance().excUpdateQuery(refSqlToUptPaReqBatchStatus, logParams, pool);
                    logger.info(`generatePAReqBatchFile,uptCompleteStatusRes: ${JSON.stringify(uptCompleteStatusRes)} records updated Successfully`);
                } else {
                    //update the status to initial status i.e: 501 
                    //TBD about the Failure Audit event
                    //reqAuditEventData.auditeventdata = process.env.ssm_batch_file_gen_failure_audit_event;
                    //const failureAuditEventRes = await BuildBulkAuditEventSerivce.getInstance().buildBulkAuditEventArry(null, reqAuditEventData)
                    // logger.info(`generatePAReqBatchFile,batchStatus: ${failureAuditEventRes}`);
                    refSqlToUptPaReqBatchStatus = refSqlToUptPaReqBatchStatus.replace('$1', SSConstants.INITAIL);
                    refSqlToUptPaReqBatchStatus = refSqlToUptPaReqBatchStatus.replace('$2', SSConstants.INPROCESS);
                    refSqlToUptPaReqBatchStatus = refSqlToUptPaReqBatchStatus.replace('$3', recordTypeIndi);
                    refSqlToUptPaReqBatchStatus = refSqlToUptPaReqBatchStatus.replace('$4', msgDataCenterID);
                    const uptInitialStatusRes = await PostgresSQLService.getInstance().excUpdateQuery(refSqlToUptPaReqBatchStatus, logParams, pool);
                    logger.info(`generatePAReqBatchFile,uptCompleteStatusRes: ${JSON.stringify(uptInitialStatusRes)} records updated Successfully`);
                }
                return batchStatus;
            } else {
                //TBD: Need to generate empty file or not
                logger.info(`generatePAReqBatchFile,Batch data not availble for recordTypeIndi: '${recordTypeIndi}' dataCenterID: '${msgDataCenterID}' formattedDateTime: ${formattedDateTime}`);
            }

        } catch(err) {
            logger.error(`generatePAReqBatchFile,ERROR: ${err.stack}` );
            throw Error(`generatePAReqBatchFile, ERROR in Catch: ${JSON.stringify(err)}`);
        }
    }

}
/*
async function _uptFileNameInSubmsnTrans (logger, batchData, batchFileName, pool) {
    try {
        logger.info(`_uptFileNameInSubmsnTrans,refSqltoUptFileName: ${refSqltoUptFileName}`);
        let insertVals = '';
        let i = 0;
        const noOfRecords = batchData.length;
        let logParams = {};
        for await (const eachRecord of batchData) {
            let glblUniqId = eachRecord.glbl_uniq_id;
            if (insertVals !== '') {
                insertVals = insertVals + ', ';
            }
            insertVals = insertVals + `'${glblUniqId}'`
            i += 1
            if (i % maxNoOfUptRecs === 0 || i === noOfRecords ) {
                refSqltoUptFileName = refSqltoUptFileName.replace('$1', batchFileName);
                refSqltoUptFileName = refSqltoUptFileName.replace('$2', insertVals.trim());
                const uptFileNameinSubmsnTransRes = await PostgresSQLService.getInstance().excUpdateQuery(refSqltoUptFileName, logParams, pool);
                logger.info(`_uptFileNameInSubmsnTrans,uptFileNameinSubmsnTransRes: ${uptFileNameinSubmsnTransRes}`);
                insertVals = '';
                if (i === noOfRecords) {
                    return SUCCESS
                }
            }
        }

    } catch (err) {
        logger.error(`uptFileNameInSubmsnTrans,ERROR catch: ${err.stack}`)
    }
}
*/
module.exports = PAReqBatchFileSerivce;