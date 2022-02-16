'use strict';

const loggerUtils = require('../../sharedLib/common/logger-utils');
const { getAvailableDataFromDB } = require('../../sharedLib/common/get-available-data-from-db');

const EventName = 'PROCESS_BATCHFILE_MSG'

async function processBatchFileSQSMessage (messageDataObj, requiredEnvData, PostgresDBSevice) {
    const logParams = {}
    const logger = loggerUtils.customLogger(EventName, logParams);
    logger.info(`processBatchFileSQSMessage,  messageData : ${JSON.stringify(messageDataObj)}`)
    try {
        let i = 0;
        for (i = 0; i < messageDataObj.length; i++) {
            logger.info(`processBatchFileSQSMessage, messageDataObj : ${messageDataObj[i]} messageData: ${JSON.stringify(messageDataObj[i])}`);
            const msgData = messageDataObj[i]
            const recordTypeIndi = msgData.clm_type_ind
            const dataCenterID = msgData.data_cntr_id
            const valsToReplace = ['YYYYMMDD', recordTypeIndi, dataCenterID]
            const batchData = await getAvailableDataFromDB (logParams, valsToReplace, requiredEnvData, PostgresDBSevice)
            logger.info(`processBatchFileSQSMessage, batchData.length: ${batchData.length}`);
            if ( batchData.length > 0 ) {
                logger.info(`processBatchFileSQSMessage, batchData.length: ${batchData.length}`);
            }
        }

    } catch (err) {
        logger.error(`processBatchFileSQSMessage, Error in Processing the message: ${err.stack}`);
        throw new Error('processBatchFileSQSMessage, Completed with errors.');
    }
    
}

module.exports = {
    processBatchFileSQSMessage,
}