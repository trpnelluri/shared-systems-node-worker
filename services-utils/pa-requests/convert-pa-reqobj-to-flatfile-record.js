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

const EventName = 'CONVERT_PAREQ_TO_FF_REC'

async function convertPAReqObjToFlatFileRecord (payload, glblUniqId, configFolder, paReqBodyObjName ) {
    const logParams = { globaltransid: glblUniqId };
    const logger = loggerUtils.customLogger(EventName, logParams);
    try {
        const bodyObjName = await populateKeyName(glblUniqId, configFolder, paReqBodyObjName)
        logger.debug(`convertPAReqObjToFlatFileRecord, keyName: ${bodyObjName}`);
        const mapPAReqBodyObj = await fetchJSONObjFromS3Config(glblUniqId, bodyObjName);
        logger.debug(`convertPAReqObjToFlatFileRecord, mapPAReqBodyObj: ${JSON.stringify(mapPAReqBodyObj)}`);
        const paReqFFRecData = fixy.unparse(mapPAReqBodyObj, payload)
        logger.info(`convertPAReqObjToFlatFileRecord, paReqFFRecData: ${JSON.stringify(paReqFFRecData)}`);
        return paReqFFRecData
    } catch (err) {
        logger.error(`convertPAReqObjToFlatFileRecord, ERROR: : ${err.stack}` )
    }
}

module.exports = {
    convertPAReqObjToFlatFileRecord,
}