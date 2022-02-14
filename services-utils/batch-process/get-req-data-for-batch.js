'use strict'

const loggerUtils = require('../../sharedLib/common/logger-utils');
const PostgresDBSevice = require('../../sharedLib/db/postgre-sql-pool');

const sqlToGetRequiredInfo = process.env.ref_sql_pa_req_batch_data
const EventName = 'GET_REQUIRED_DATA_FOR_BATCHFILE'
PostgresDBSevice.connectToPostgresDB();

exports.getRequiredDataForBatchfile = async () => {
    const logParams = {}
    const logger = loggerUtils.customLogger( EventName, logParams);
    
    return new Promise((resolve, reject) => {
        const dateToday = new Date();
        let hours = dateToday.getHours()
        logger.info (`getRequiredDataForBatchfile, hours: ${hours}`)
        if (hours < 10) {
            hours = '0' + hours
        }
        const valsToReplace = ['HH24', 'HH24', hours];
        PostgresDBSevice.getRequiredRefData(sqlToGetRequiredInfo, valsToReplace, logParams, (err, generateBatchFile, batchFileInfo) => {
            logger.info( `getRequiredDataForBatchfile, generateBatchFile: ${generateBatchFile} AuditEventRefDataObj: ${JSON.stringify(batchFileInfo)}`);
            if (err) {
                logger.error(`getRequiredDataForBatchfile, ERROR: getRequiredRefData: ${err.stack}`);
                reject(err);
            } else {
                resolve(batchFileInfo);
            }
        });
    }).catch((error) => {
        logger.error(`getRequiredDataForBatchfile, ERROR: ${error}` )
    });
};