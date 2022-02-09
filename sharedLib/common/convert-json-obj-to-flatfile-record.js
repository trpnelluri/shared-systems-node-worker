'use strict'
/**
 *  This is an esMD service to convert the request JSON obj into flatfile record.
 *
 * @author Siva Nelluri
 * @date 02/07/2021
 * @version 1.0.0
 *
*/

const fixy = require('fixy')
const loggerUtils = require('./logger-utils');
const { populateKeyName } = require('./populate-keyname');
const { fetchJSONObjFromS3Config } = require('../aws/fetch-config-json-obj-from-s3');

const EventName = 'CONVERT_PAREQ_TO_FF_REC'

/*
The follwoing function is used to convert the request json object into flatfile record based on the 
    the config object available in aws s3.
*/
async function convertPAReqObjToFlatFileRecord (payload, glblUniqId, configFolder, configObjName ) {
    const logParams = { globaltransid: glblUniqId };
    const logger = loggerUtils.customLogger(EventName, logParams);
    try {
        const objKeyName = await populateKeyName(glblUniqId, configFolder, configObjName)
        logger.debug(`convertPAReqObjToFlatFileRecord, objKeyName: ${objKeyName}`);
        const mapObj = await fetchJSONObjFromS3Config(glblUniqId, objKeyName);
        logger.debug(`convertPAReqObjToFlatFileRecord, mapObj: ${JSON.stringify(mapObj)}`);
        const flatFileRecData = fixy.unparse(mapObj, payload)
        logger.info(`convertPAReqObjToFlatFileRecord, paReqFFRecData: ${JSON.stringify(flatFileRecData)}`);
        return flatFileRecData
    } catch (err) {
        logger.error(`convertPAReqObjToFlatFileRecord, ERROR: : ${err.stack}` )
    }
}

module.exports = {
    convertPAReqObjToFlatFileRecord,
}