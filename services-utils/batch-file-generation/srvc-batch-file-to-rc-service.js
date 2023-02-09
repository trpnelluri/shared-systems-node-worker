'use strict';

const lodash = require('lodash');
const loggerUtils = require('../../sharedLib/common/logger-utils');
const PostgresSQLService = require('../../sharedLib/db/postgre-sql-service');
const EnvForFileNameService = require('../../sharedLib/common/env-value-for-filename-service');
const BatchFileToDCService = require('./batch-file-to-dc-service');
const GenerateAuditEventSerivce = require('../../sharedLib/common/generate-auidt-event');
const InsertDataService = require('./build-insert-data-service');

const clsName = 'SRVCBatchFileToRCSerivce';
const SUCCESS = 'Success';
const FAILURE = 'Failure';
const tempDirectory = process.env.temp_path;
const refSQLtoGetSRVCNonMacRCs = process.env.ref_sql_to_get_active_rcs_srvc_file_delivery
let instance = null;

class SRVCBatchFileToRCSerivce {

    static getInstance(){
        if(!instance){
            instance = new SRVCBatchFileToRCSerivce();
        }
        return instance;
    }

    async generateSRVCBatchfileToRC (reqDataToGenBatchFile, reqAuditEventData, batchFileCopyflag, sourceBatchFileName, msgData, pool) {
        
        const fileNameDate = reqDataToGenBatchFile.filenamedate;
        const glblUniqId = reqDataToGenBatchFile.globaltransid;
        const batchFileFor = reqDataToGenBatchFile.batchfilefor;
        const logParams = { globaltransid: glblUniqId };
        const logger = loggerUtils.customLogger(clsName, logParams);
        
        try {
            const batchFileName = process.env.srvc_rc_batch_fileName;
            const formattedDateTime = reqDataToGenBatchFile.formatteddatetime;
            const activeSRVCRCData = await PostgresSQLService.getInstance().excSelectQuery(refSQLtoGetSRVCNonMacRCs, logParams, pool);
            //Generatin 1 batch file for each RC related dept '5' 
            if ( !(lodash.isEmpty(activeSRVCRCData))) {
                logger.info(`generateSRVCBatchfileToRC,activeSRVCRCData.length: ${activeSRVCRCData.length} activeSRVCRCData: ${JSON.stringify(activeSRVCRCData)}`);
                let i = 0;
                let rcBatchFileGenSuccessFlag = true;
                msgData.data_cntr_id = '' //ESMA-3857
                for await (const eachRCInfo of activeSRVCRCData) {
                    logger.info(`generateSRVCBatchfileToRC,eachRCInfo: ${JSON.stringify(eachRCInfo)}`);
                    const RCMailBox = eachRCInfo.mail_routg_num;
                    const RCJrsdctnId = eachRCInfo.cntrctr_jrsdctn_id;
                    const rcBatchFileNameRes = await _populateRCFileName (logger, batchFileName, glblUniqId, formattedDateTime, fileNameDate, RCMailBox);
                    logger.info(`generateSRVCBatchfileToRC,rcBatchFileNameRes: ${rcBatchFileNameRes} sourceBatchFileName: ${sourceBatchFileName} batchFileCopyflag: ${batchFileCopyflag}`);
                    const targetFileNameWithDir = tempDirectory + rcBatchFileNameRes;
                    reqDataToGenBatchFile.batchFileName = rcBatchFileNameRes;
                    let batchFileToDCService = await BatchFileToDCService.getInstance();
                    let batchStatus = await batchFileToDCService.batchFileToDC(reqDataToGenBatchFile, targetFileNameWithDir, batchFileCopyflag, sourceBatchFileName, RCMailBox);
                    logger.info(`generateSRVCBatchfileToRC,batchStatus: ${batchStatus}`);
                    reqAuditEventData.flatfilename = rcBatchFileNameRes; // Adding file name in Audit event data
                    reqAuditEventData.batchfilefor = batchFileFor;
                    if ( batchStatus === SUCCESS ){
                        msgData.fil_name = rcBatchFileNameRes; // ADDING RC File name
                        msgData.cntrctr_jrsdctn_id = RCJrsdctnId
                        const insertSysBatchJobRes = await InsertDataService.getInstance().buildAndInsertSysBatchRec(glblUniqId, msgData, pool)
                        logger.info(`generateSRVCBatchfileToRC,insertSysBatchJobRes: ${insertSysBatchJobRes} for batchFileName: ${rcBatchFileNameRes}`);
                        let auditEventStatus = await GenerateAuditEventSerivce.getInstance().generateAuditEvent ( glblUniqId, reqAuditEventData);
                        logger.info(`generateSRVCBatchfileToRC,auditEventStatus: ${auditEventStatus} for batchFileName: ${rcBatchFileNameRes}`);
                        i = i + 1;
                    } else {
                        rcBatchFileGenSuccessFlag = false;
                    }

                    if ( i === activeSRVCRCData.length ) {
                        return SUCCESS;
                    } else {
                        if (!rcBatchFileGenSuccessFlag) {
                            return FAILURE;
                        }
                    }
                }
            }
        } catch (err){
            logger.error(`generateSRVCBatchfileToRC,ERROR: ${err.stack}` );
            throw Error(`generateSRVCBatchfileToRC, ERROR in Catch: ${JSON.stringify(err)}`);
        }

    }
}


async function _populateRCFileName (logger, batchFileName, globalTransID, formattedDateTime, fileNameDate, RCMailBox ) {
    try {
        //const dateToday = formattedDateTime.substring(0, 8)
        const timeNow = formattedDateTime.substring(8, 14);
        if ( globalTransID === 'null' ) {
            globalTransID = 'SRVCRCBAT' + timeNow;
        }
        logger.info(`_populateRCFileName,formattedDateTime: ${formattedDateTime} batchFileName: ${batchFileName} fileNameDate: ${fileNameDate} timeNow: ${timeNow}` );
        const currentEnv = await EnvForFileNameService.getInstance().envValForFileName(logger);
        batchFileName = batchFileName.replace('<<env>>', currentEnv);
        batchFileName = batchFileName.replace('<<ReceiverRoutingId>>', RCMailBox);
        batchFileName = batchFileName.replace('<<GUID>>', globalTransID);
        batchFileName = batchFileName.replace('<<MMddyy>>', fileNameDate);
        batchFileName = batchFileName.replace('<<HHmmss>>', timeNow);

        logger.info(`_populateRCFileName,returnData: ${batchFileName}`);
        return batchFileName;
    } catch(err) {
        logger.error(`_populateRCFileName,ERROR: ${err.stack}` )
        throw Error(`_populateRCFileName, ERROR in Catch: ${JSON.stringify(err)}`);
    }
}

module.exports = SRVCBatchFileToRCSerivce;