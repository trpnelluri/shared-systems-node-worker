/**
 *  This is an esMD sqs consumer serivce to handle the SQS message processing and insert the data into appropriate tables in postgre-sql database.
 *
 * @author Siva Nelluri
 * @date 02/07/2021
 * @version 1.0.0
 *
*/
'use strict'

const fixy = require('fixy')
//const PostgresDBSevice = require('../../sharedLib/db/postgre-sql-pool');
const loggerUtils = require('../../sharedLib/common/logger-utils');
const { populateKeyName } = require('../../sharedLib/common/populate-keyname');
const { fetchJSONObjFromS3Config } = require('../../sharedLib/aws/fetch-config-json-obj-from-s3');

const EventName = 'PROCESS_PA_REQUEST'
const configFolder = process.env.pareqconfigfolder
const paReqBodyObjName = process.env.bodyobj

exports.processPAReqSQSMsg = async function (payload, glblUniqId, msgId ) {
    const logParams = { globaltransid: glblUniqId, messageid: msgId };
    const logger = loggerUtils.customLogger(EventName, logParams);
    try {

        const bodyObjName = await populateKeyName(glblUniqId, configFolder, paReqBodyObjName)
        logger.debug(`processPAReqSQSMsg, keyName: ${bodyObjName}`);
        let mapPAReqBodyObj = await fetchJSONObjFromS3Config(bodyObjName);
        logger.info(`processPAReqSQSMsg, mapPAReqBodyObj: ${JSON.stringify(mapPAReqBodyObj)}`);
        const paReqDataObj = payload.ffdata
        logger.info(`processPAReqSQSMsg, paReqDataObj: ${JSON.stringify(paReqDataObj)}`);
        //const paReqDataObj = JSON.parse(paReqData)
        const paReqFFRecData = fixy.unparse(mapPAReqBodyObj, paReqDataObj)
        logger.info(`processPAReqSQSMsg, paReqFFRecData: ${JSON.stringify(paReqFFRecData)}`);
    } catch (err) {
        logger.error(`processPAReqSQSMsg, ERROR:  payload: ${err.stack}`);
    }
}