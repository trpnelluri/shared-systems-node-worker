'use strict';

const loggerUtils = require('../../sharedLib/common/logger-utils');

const EventName = 'PROCESS_BATCHFILE_MSG'

async function processBatchFileSQSMessage (messageDataObj, requiredEnvData) {

    const logger = loggerUtils.customLogger(EventName, {});
    logger.info(`processBatchFileSQSMessage,  messageData : ${JSON.stringify(messageDataObj)}`)
    try {
        let i = 0;
        for (i = 0; i < messageDataObj.length; i++) {
            logger.info(`processBatchFileSQSMessage, messageDataObj : ${messageDataObj[i]} messageDataObj: ${JSON.stringify(messageDataObj[i])}`);
        }

    } catch (err) {
        logger.error(`processBatchFileSQSMessage, Error in Processing the message: ${err.stack}`);
        throw new Error('processBatchFileSQSMessage, Completed with errors.');
    }
    
}

module.exports = {
    processBatchFileSQSMessage,
}