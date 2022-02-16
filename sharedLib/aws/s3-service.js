'use strict';

const AWS = require('aws-sdk');
const loggerUtils = require('../common/logger-utils');

const s3Client = new AWS.S3();
const EventName = 'S3_SERVICE'
let instance = null;

class S3Service{

    static getInstance()
    {
        if(!instance){
            instance = new S3Service();
        }
        return instance;
    }

    async getObj(bucket, key, logParams) {
        const logger = loggerUtils.customLogger( EventName, logParams);
        const params = {
            Bucket: bucket,
            Key: key,
        };
        logger.info(`getObj, params: ${JSON.stringify(params)}`)
        try {
            let data = await s3Client.getObject(params).promise();
            let strData = data.Body.toString('utf-8');
            let objData = JSON.parse(strData); // passing the buffer directly will have it converted to string
            logger.info(`getObj, objData: ${JSON.stringify(objData)}`)
            return objData
        } catch (err) {
            logger.error(`getObj, ERROR in getObj catch ${JSON.stringify(err.stack)}`)
            throw Error(`S3Service.getObj, Failed to get file ${key}, from ${bucket}, Error: ${JSON.stringify(err)}`);
        }
    }

    async getText(bucket, key, logParams) {
        const logger = loggerUtils.customLogger( EventName, logParams);
        const params = {
            Bucket: bucket,
            Key: key,
        };
        logger.info(`getText, params: ${JSON.stringify(params)}`)
        try {
            let data = await s3Client.getObject(params).promise();
            logger.info(`getText, data: ${data.Body.toString()}`)
            return data.Body.toString();
        } catch (err) {
            logger.error(`getText, ERROR in getObj catch ${JSON.stringify(err.stack)}`)
            throw Error(`S3Service.getText, Failed to get file ${key}, from ${bucket}, Error: ${JSON.stringify(err)}`);
        }
    }

    async exists(bucket, key, logParams) {
        const logger = loggerUtils.customLogger( EventName, logParams);
        const params = {
            Bucket: bucket,
            Key: key,
        };
        logger.info(`exists, params: ${JSON.stringify(params)}`)
        try {
            const info = await s3Client.headObject(params).promise();
            logger.info(`exists, File Exists: ${JSON.stringify(info)}`);
            return true;
        } catch (err) {
            if (err.statusCode === 404) {
                return false
            }
            throw Error(`S3Service.exists> There was an error getting information on the file ${key}, for ${bucket}, Error: ${JSON.stringify(err)}`);
        }
    }
    /*
    //TBD to use in future
    async write(obj, bucket, key) {
        return this.writeText(JSON.stringify(obj), bucket, key);
    }

    async writeText(txt, bucket, key) {
        const params = {
            Bucket: bucket,
            Body: txt,
            Key: key,
        };

        try {
            return await s3Client.putObject(params).promise();
        } catch (err) {
            throw Error(`S3Service.get> There was an error writing the file ${key}, for ${bucket}, Error: ${JSON.stringify(err)}`);
        }
    }
    */
}

module.exports = S3Service;