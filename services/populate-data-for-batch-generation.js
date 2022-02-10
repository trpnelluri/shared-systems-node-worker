'use strict';

const loggerUtils = require('../sharedLib/common/logger-utils');
const { getRequiredDataForBatchfile } = require('../services-utils/batch-process/get-req-data-for-batch')

const EventName = 'POPULATE_DATA_FOR_BATCHFILE'

async function populateDataForBatchFileGeneration () {
    const logger = loggerUtils.customLogger(EventName, {});
    try{
        const response = await getRequiredDataForBatchfile ()
        logger.info(`response: ${JSON.stringify(response)}`)

    } catch(err) {
        logger.error('Error')
    }
}
module.exports = {
    populateDataForBatchFileGeneration,
}