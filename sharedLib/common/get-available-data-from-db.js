'use strict'

const loggerUtils = require('./logger-utils');

const EventName = 'GET_AVAILABLE_DATA_FROM_DB'

async function getAvailableDataFromDB(logParams, valsToReplace, requiredEnvData, PostgresDBSevice){

    const logger = loggerUtils.customLogger( EventName, logParams);
    return new Promise((resolve, reject) => {
        const sqlToGetRequiredInfo = requiredEnvData.refsql
        logger.info(`getAvailableDataFromDB, sqlToGetRequiredInfo: ${sqlToGetRequiredInfo} valuesToRlace: ${JSON.stringify(valsToReplace)}`)

        PostgresDBSevice.getRequiredRefData(sqlToGetRequiredInfo, valsToReplace, logParams, (err, generateBatchFile, batchFileInfo) => {
            logger.info( `getAvailableDataFromDB, generateBatchFile: ${generateBatchFile}`);
            if (err) {
                logger.error(`getAvailableDataFromDB, ERROR: getRequiredRefData: ${err.stack}`);
            } else {
                resolve(batchFileInfo)
            }
        });
    }).catch((error) => {
        logger.error(`getAvailableDataFromDB, ERROR catch: ${error}` )
        throw new Error(`getAvailableDataFromDB, Error getting the required data from database ${error.stack}`);
    });
}
module.exports = {
    getAvailableDataFromDB,
}