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
const loggerUtils = require('../../sharedLib/common/logger-utils');
const { populateKeyName } = require('../../sharedLib/common/populate-keyname');
const { fetchJSONObjFromS3Config } = require('../../sharedLib/aws/fetch-config-json-obj-from-s3');

const EventName = 'GENERATE_FF_RECORD'

async function generateFlatFileRecord (payload, glblUniqId, configFolder, paReqBodyObjName ) {
    const logParams = { globaltransid: glblUniqId };
    const logger = loggerUtils.customLogger(EventName, logParams);
    try {
        const bodyObjName = await populateKeyName(glblUniqId, configFolder, paReqBodyObjName)
        logger.debug(`generateFlatFileRecord, keyName: ${bodyObjName}`);
        const mapPAReqBodyObj = await fetchJSONObjFromS3Config(glblUniqId, bodyObjName);
        logger.debug(`processPAReqSQSMsg, mapPAReqBodyObj: ${JSON.stringify(mapPAReqBodyObj)}`);
        const paReqDataObj = payload.ffdata
        logger.debug(`processPAReqSQSMsg, paReqDataObj: ${JSON.stringify(paReqDataObj)}`);
        const paReqFFRecData = fixy.unparse(mapPAReqBodyObj, paReqDataObj)
        logger.info(`generateFlatFileRecord, paReqFFRecData: ${JSON.stringify(paReqFFRecData)}`);
        return paReqFFRecData
    } catch (err) {
        logger.error(`generateFlatFileRecord, ERROR: : ${err.stack}` )
    }
}

module.exports = {
    generateFlatFileRecord,
}