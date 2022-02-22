'use strict';

const loggerUtils = require('../../sharedLib/common/logger-utils');

const EventName = 'POPULATE_FILE_NAME'

async function populateBatchFileName (batchFileName, formattedDateTime) {
    const logParams = {}
    const logger = loggerUtils.customLogger(EventName, logParams);
    try {
        logger.debug(`populateBatchFileName, formattedDateTime: ${formattedDateTime}` )
        const dateToday = formattedDateTime.substring(0, 8)
        const timeNow = formattedDateTime.substring(8, 14)
        
        if ( batchFileName !== undefined && batchFileName !== null ){
            batchFileName = batchFileName.replace('{0}', dateToday)
            batchFileName = batchFileName.replace('{1}', timeNow)
        }
        logger.debug(`populateBatchFileName, final batchFileName: ${batchFileName}` )
        return batchFileName
    } catch (err) {
        logger.error(`populateBatchFileName, ERROR: ${err.stack}` )
        throw Error(`populateBatchFileName, ERROR in Catch: ${JSON.stringify(err)}`);
    }

}

module.exports = {
    populateBatchFileName,
}