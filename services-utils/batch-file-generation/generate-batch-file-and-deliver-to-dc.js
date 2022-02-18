'use strict';

const loggerUtils = require('../../sharedLib/common/logger-utils');

const EventName = 'GENERATE_BATCH_FILE_TO_DC'

async function generateBatchFileToDC (headerData, batchData, trailerData) {
    const logParams = {}
    const logger = loggerUtils.customLogger(EventName, logParams);

    try {
        logger.info('generateBatchFileToDC started')

    } catch(err) {
        logger.error(`generateBatchFileToDC, ERROR in catch: ${err.stack}`);
        throw new Error('generateBatchFileToDC Completed with errors.');
    }

}

module.exports = {
    generateBatchFileToDC,
}