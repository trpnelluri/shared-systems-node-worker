'use strict'

const AWS = require('aws-sdk');
const loggerUtils = require('../common/logger-utils');
const s3 = new AWS.S3();
const bucket = process.env.bucketname;

const EventName = 'GET_CONFIG_OBJ_FROM_S3'

async function fetchJSONObjFromS3Config(glblUniqId, objectKey){
    try {
        let logParams = {globaltransid: glblUniqId}
        let logger = loggerUtils.customLogger( EventName, logParams);
        const getObjParams = {
            Bucket: bucket,
            Key: objectKey
        }
        logger.info(`fetchJSONObjFromS3Config, getObjParams: ${JSON.stringify(getObjParams)}`)
        const data = await s3.getObject(getObjParams).promise();
        let strData = data.Body.toString('utf-8');
        let objData = JSON.parse(strData); // passing the buffer directly will have it converted to string
        logger.info(`fetchJSONObjFromS3Config, getObjParams: ${JSON.stringify(objData)}`)
        return objData
    } catch (e) {
        throw new Error(`Could not retrieve file from S3: ${e.stack}`)
    }
}
module.exports = {
    fetchJSONObjFromS3Config
};