'use strict';

const loggerUtils = require('../../sharedLib/common/logger-utils');
const dateTimeUtils = require('../../sharedLib/common/date-time-utils');
const PostgresPoolService = require('../../sharedLib/db/postgre-pool-service');
const DCFBatchFileSerivce = require('./dcf-batch-file-service');
const PAReqBatchFileSerivce = require('./pa-request-batch-file-service');
const SRVCBatchFileSerivce = require('./srvc-batch-file-service');

const EventName = 'PROCESS_BATCHFILE_MSG';
const genSrvcregBatchId = process.env.batch_file_for_srvcreg_id || '4';
const genDcfBatchId = process.env.batch_file_for_dcf_id || '5';

async function processBatchFileSQSMessage (messageDataObj, reqQueueDetails) {
    const logParams = {};
    const logger = loggerUtils.customLogger(EventName, logParams);
    logger.info(`processBatchFileSQSMessage,  messageData : ${JSON.stringify(messageDataObj)}`);
    
    try {
        const pool = await PostgresPoolService.getInstance().connectToPostgresDB();
        for (let i = 0; i < messageDataObj.length; i++) {
            logger.info(`processBatchFileSQSMessage, messageDataObj : ${messageDataObj[i]} messageData: ${JSON.stringify(messageDataObj[i])}`);
            const msgData = messageDataObj[i];
            const batchFileFor = msgData.clm_type_id.toString();
            const dateTimeData = await dateTimeUtils.formattedDateTime(logger);
            logger.info(`processBatchFileSQSMessage,batchFileFor: ${batchFileFor} genSrvcregBatchId: ${genSrvcregBatchId} genDcfBatchId: ${genDcfBatchId} dateTimeData: ${dateTimeData}`);

            if ( batchFileFor === genSrvcregBatchId ) {     //SRVCREG 
                //TBD: Need to implement Scheduler JOB for SRVC to update the dsata in esmd_data.ENRLMT_INFO
                let srvcBatchFileSerivce = await SRVCBatchFileSerivce.getInstance();
                const srvcBatchFileGenRes = await srvcBatchFileSerivce.generateSRVCBatchFile(msgData, reqQueueDetails, batchFileFor, dateTimeData, pool);
                logger.info(`processBatchFileSQSMessage,srvcBatchFileGenRes: ${srvcBatchFileGenRes}`)
            } else if ( batchFileFor === genDcfBatchId ) {  //DCF
                let dcfBatchFileSerivce = await DCFBatchFileSerivce.getInstance();
                const dcfFileGenRes = await dcfBatchFileSerivce.generateDCFBatchFile(msgData, reqQueueDetails, batchFileFor, dateTimeData, pool);
                logger.info(`processBatchFileSQSMessage,dcfFileGenRes: ${dcfFileGenRes}`);
            } else {        //PA REQUEST
                let paReqBatchFileSerivce = await PAReqBatchFileSerivce.getInstance();
                const paReqFileGenRes = await paReqBatchFileSerivce.generatePAReqBatchFile(msgData, reqQueueDetails, batchFileFor, dateTimeData, pool);
                logger.info(`processBatchFileSQSMessage,paReqFileGenRes: ${paReqFileGenRes}`);
            }
            await _delay(2000);  //2 seconds
        }
    } catch (err) {
        logger.error(`processBatchFileSQSMessage,Error in Processing the message: ${err.stack}`);
        throw new Error('processBatchFileSQSMessage, Completed with errors.');
    }
}

async function _delay(time) {
    return new Promise(resolve => setTimeout(resolve, time));
}
  

module.exports = {
    processBatchFileSQSMessage,
}