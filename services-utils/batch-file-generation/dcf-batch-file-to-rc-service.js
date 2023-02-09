'use strict';

const lodash = require('lodash');
const loggerUtils = require('../../sharedLib/common/logger-utils');
const PostgresSQLService = require('../../sharedLib/db/postgre-sql-service');
const EnvForFileNameService = require('../../sharedLib/common/env-value-for-filename-service');
const BatchFileToDCService = require('./batch-file-to-dc-service');
const GenerateAuditEventSerivce = require('../../sharedLib/common/generate-auidt-event');
const GenerateNotificationSerivce = require('../../sharedLib/common/generate-notification-event');
const InsertDataService = require('./build-insert-data-service');

const clsName = 'DCFBatchFileToRCSerivce';
const SUCCESS = 'Success';
const FAILURE = 'Failure';
const dcfBatchSuccessNotifyType = 'DCF_FLATFILE_GEN_SUCCESS';
let refSqlToGetActiveRCs = process.env.ref_sql_to_get_active_rcs_dcf_file_delivery
const tempDirectory = process.env.temp_path;

let instance = null;

class DCFBatchFileToRCSerivce {

    static getInstance(){
        if(!instance){
            instance = new DCFBatchFileToRCSerivce();
        }
        return instance;
    }

    async generateDCFBatchToRCs(reqDataToGenBatchFile, reqAuditEventData, batchFileName, batchFileCopyflag, sourceBatchFileName, msgData, pool) {
        const glblUniqId = reqDataToGenBatchFile.globaltransid;
        const fileNameDate = reqDataToGenBatchFile.filenamedate;
        const batchFileFor = reqDataToGenBatchFile.batchfilefor;
        const logParams = {globaltransid: glblUniqId};
        const logger = loggerUtils.customLogger(clsName, logParams);
        try {
            logger.info(`generateDCFBatchToRCs,batchFileName: ${JSON.stringify(batchFileName)} batchFileCopyflag: ${batchFileCopyflag} sourceBatchFileName: ${sourceBatchFileName}`);
            const formattedDateTime = reqDataToGenBatchFile.formatteddatetime;
            const activeDCFRCData = await PostgresSQLService.getInstance().excSelectQuery(refSqlToGetActiveRCs, logParams, pool);
            //Generatin 1 batch file for each RC related dept '17' 
            if ( !(lodash.isEmpty(activeDCFRCData))) {
                logger.info(`generateDCFBatchToRCs,activeDCFRCData.length: ${activeDCFRCData.length} activeDCFRCData: ${JSON.stringify(activeDCFRCData)}`);
                let i = 0;
                let rcBatchFileGenSuccessFlag = true;
                msgData.data_cntr_id = '' //ESMA-3857
                for await (const eachRCInfo of activeDCFRCData) {
                    logger.info(`generateDCFBatchToRCs,eachRCInfo: ${JSON.stringify(eachRCInfo)}`);
                    const RCMailBox = eachRCInfo.mail_routg_num;
                    const DcfDept = eachRCInfo.content_type_id;
                    const RCJrsdctnId = eachRCInfo.cntrctr_jrsdctn_id;
                    const rcBatchFileNameRes = await _populateRCFileName (logger, batchFileName, glblUniqId, formattedDateTime, fileNameDate, RCMailBox, DcfDept);
                    const targetFileNameWithDir = tempDirectory + rcBatchFileNameRes;
                    reqDataToGenBatchFile.batchFileName = rcBatchFileNameRes;
                    let batchFileToDCService = await BatchFileToDCService.getInstance();
                    let batchStatus = await batchFileToDCService.batchFileToDC(reqDataToGenBatchFile, targetFileNameWithDir, batchFileCopyflag, sourceBatchFileName, RCMailBox);
                    reqAuditEventData.flatfilename = rcBatchFileNameRes; // Adding file name in Audit event data
                    reqAuditEventData.batchfilefor = batchFileFor;
                    if ( batchStatus === SUCCESS ) {
                        msgData.fil_name = rcBatchFileNameRes; // ADDING RC File name
                        msgData.cntrctr_jrsdctn_id = RCJrsdctnId;
                        const insertSysBatchJobRes = await InsertDataService.getInstance().buildAndInsertSysBatchRec(glblUniqId, msgData, pool)
                        logger.info(`generateSRVCBatchfileToRC,insertSysBatchJobRes: ${insertSysBatchJobRes} for batchFileName: ${rcBatchFileNameRes}`);
                        let auditEventStatus = await GenerateAuditEventSerivce.getInstance().generateAuditEvent ( glblUniqId, reqAuditEventData );
                         
                        reqAuditEventData.notificationtype = dcfBatchSuccessNotifyType;
                        let sendNotifyRes = await GenerateNotificationSerivce.getInstance().generateNotificationEvent(glblUniqId, reqAuditEventData);
                        logger.info(`generateDCFBatchToRCs,auditEventStatus: ${auditEventStatus} sendNotifyRes: ${sendNotifyRes} for batchFileName: ${rcBatchFileNameRes}`);
                        i += 1;
                    } else {
                        rcBatchFileGenSuccessFlag = false;
                    }

                    if ( i === activeDCFRCData.length ) {
                        return SUCCESS;
                    } else {
                        if (!rcBatchFileGenSuccessFlag) {
                            return FAILURE;
                        }
                    }
                }
    
            } else {
                logger.info(`generateDCFBatchToRCs, Active RC's not available to deliver the DCF Batch file: ${activeDCFRCData.length}`);
            }

        } catch (err) {
            logger.error(`generateDCFBatchFile,ERROR: ${err.stack}`);
            throw Error(`generateDCFBatchFile, ERROR in Catch: ${JSON.stringify(err)}`);
        }
        
    }

}

async function _populateRCFileName (logger, batchFileName, globalTransID, formattedDateTime, fileNameDate, RCMailBox, DcfDept) {
    try {
        const timeNow = formattedDateTime.substring(8, 14);
        logger.info(`_populateRCFileName,formattedDateTime: ${formattedDateTime} batchFileName: ${batchFileName} fileNameDate: ${fileNameDate} timeNow: ${timeNow}`);
        const currentEnv = await EnvForFileNameService.getInstance().envValForFileName(logger);
        
        batchFileName = batchFileName.replace('<<ReceiverRoutingId>>', RCMailBox);
        batchFileName = batchFileName.replace('<<env>>', currentEnv);
        batchFileName = batchFileName.replace('<<CTC>>', DcfDept);
        batchFileName = batchFileName.replace('<<GUID>>', globalTransID);
        batchFileName = batchFileName.replace('<<SenderRoutingID>>', 'ESMD01');
        batchFileName = batchFileName.replace('<<MMddyy>>', fileNameDate);
        batchFileName = batchFileName.replace('<<HHmmss>>', timeNow);
        logger.info(`_populateRCFileName,returnData: ${batchFileName}`);
        return batchFileName;
    } catch(err) {
        logger.error(`_populateRCFileName,ERROR: ${err.stack}`);
        throw Error(`_populateRCFileName, ERROR in Catch: ${JSON.stringify(err)}`);
    }
}

module.exports = DCFBatchFileToRCSerivce;