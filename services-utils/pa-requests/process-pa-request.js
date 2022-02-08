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
const { generateFlatFileRecord } = require('./generate-flatfile-record')
const EventName = 'PROCESS_PA_REQUEST'
const configFolder = process.env.pareqconfigfolder
const paReqBodyObjName = process.env.bodyobj

async function processPAReqSQSMsg (payload, glblUniqId, msgId ) {
    const logParams = { globaltransid: glblUniqId };
    const logger = loggerUtils.customLogger(EventName, logParams);
    try {
        const paReqFFRecData = await generateFlatFileRecord(payload, glblUniqId, configFolder, paReqBodyObjName )
        logger.info(`processPAReqSQSMsg, paReqFFRecData: ${paReqFFRecData}`)

    } catch (err) {
        logger.error(`processPAReqSQSMsg, ERROR: : ${err.stack}` )
    }
}

module.exports = {
    processPAReqSQSMsg,
};