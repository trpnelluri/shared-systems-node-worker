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
const S3ServiceShared = require('../aws/s3-service');

const EventName = 'CONVERT_PAREQ_TO_FF_REC'

/*
The follwoing function is used to convert the request json object into flatfile record based on the 
    the config object available in aws s3.
*/
async function convertObjDataToFlatFileRecord (payload, glblUniqId, configFolder, configObjName ) {
    const logParams = { globaltransid: glblUniqId };
    const logger = loggerUtils.customLogger(EventName, logParams);
    const bucket = process.env.bucketname;
    try {
        const objKeyName = await populateKeyName(glblUniqId, configFolder, configObjName)
        logger.debug(`convertObjDataToFlatFileRecord, objKeyName: ${objKeyName}`);
        const mapObj = await S3ServiceShared.getInstance().getObj(bucket, objKeyName, logParams);
        logger.debug(`convertObjDataToFlatFileRecord, mapObj: ${JSON.stringify(mapObj)}`);
        const flatFileRecData = fixy.unparse(mapObj, payload)
        logger.info(`convertObjDataToFlatFileRecord, paReqFFRecData: ${JSON.stringify(flatFileRecData)}`);
        return flatFileRecData
    } catch (err) {
        logger.error(`convertObjDataToFlatFileRecord, ERROR: : ${err.stack}` )
        throw new Error('convertObjDataToFlatFileRecord, Completed with errors.');
    }
}

module.exports = {
    convertObjDataToFlatFileRecord,
}