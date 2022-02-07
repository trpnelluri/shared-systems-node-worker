/**
 *  This is an esMD sqs consumer serivce to handle the SQS message processing and insert the data into appropriate tables in postgre-sql database.
 *
 * @author Siva Nelluri
 * @date 02/07/2021
 * @version 1.0.0
 *
*/
'use strict'

//const PostgresDBSevice = require('../../sharedLib/db/postgre-sql-pool');
const loggerUtils = require('../../sharedLib/common/logger-utils');

const EventName = 'PROCESS_PA_REQUEST'

exports.processPAReqSQSMsg = async function (payload, glblUniqId, msgId ) {
    const logParams = { globaltransid: glblUniqId, messageid: msgId };
    const logger = loggerUtils.customLogger(EventName, logParams);
    try {
        const objFlatFileData = payload.ffdata
        logger.info(`processPAReqSQSMsg, objFlatFileData: ${JSON.stringify(objFlatFileData)}`);

    } catch (err) {
        logger.error(`processPAReqSQSMsg, ERROR:  payload: ${err.stack}`);
    }
}