'use strict';

const loggerUtils = require('../sharedLib/common/logger-utils');
const { getRequiredDataForBatchfile } = require('../services-utils/batch-process/get-req-data-for-batch')
const { sendMsgToGenerateFlatfileSQS } = require('../services-utils/batch-process/send-msg-to-generate-flatfile-sqs');

const EventName = 'POPULATE_DATA_FOR_BATCHFILE'

async function populateDataForBatchFileGeneration (PostgresDBSevice) {
    const logger = loggerUtils.customLogger(EventName, {});
    try{
        const response = await getRequiredDataForBatchfile (PostgresDBSevice)
        logger.info(`populateDataForBatchFileGeneration, responselength: ${response.length}`)
        if ( response.length ) {
            let sednMesageStatus = await sendMsgToGenerateFlatfileSQS(response)
            logger.info(`populateDataForBatchFileGeneration, sednMesageStatus: ${JSON.stringify(sednMesageStatus)}`)
        } else {
            logger.info('populateDataForBatchFileGeneration, Data not available to generate flatfile at this time')
        }
    } catch(err) {
        logger.error(`populateDataForBatchFileGeneration, ERROR in catch: ${err.stack}`)
    }
}
module.exports = {
    populateDataForBatchFileGeneration,
}