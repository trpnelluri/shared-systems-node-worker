'use strict';

const AWS = require('aws-sdk');
const fs = require('fs');
const loggerUtils = require('../common/logger-utils');

const s3Client = new AWS.S3();
const EventName = 'S3Service'
const SUCCESS = 'Success'
const FAILURE = 'Failure'
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
        logger.info(`getObj,params: ${JSON.stringify(params)}`)
        try {
            let data = await s3Client.getObject(params).promise();
            let strData = data.Body.toString('utf-8');
            let objData = JSON.parse(strData); // passing the buffer directly will have it converted to string
            logger.info(`getObj,objData: ${JSON.stringify(objData)}`)
            return objData
        } catch (err) {
            logger.error(`getObj,ERROR in getObj catch ${JSON.stringify(err.stack)}`)
            throw Error(`S3Service.getObj, Failed to get file ${key}, from ${bucket}, Error: ${JSON.stringify(err)}`);
        }
    }

    async getText(bucket, key, logParams) {
        const logger = loggerUtils.customLogger( EventName, logParams);
        const params = {
            Bucket: bucket,
            Key: key,
        };
        logger.info(`getText,params: ${JSON.stringify(params)}`)
        try {
            let data = await s3Client.getObject(params).promise();
            logger.info(`getText,data: ${data.Body.toString()}`)
            return data.Body.toString();
        } catch (err) {
            logger.error(`getText,ERROR in getObj catch ${JSON.stringify(err.stack)}`)
            throw Error(`S3Service.getText, Failed to get file ${key}, from ${bucket}, Error: ${JSON.stringify(err)}`);
        }
    }

    async exists(bucket, key, logParams) {
        const logger = loggerUtils.customLogger( EventName, logParams);
        const params = {
            Bucket: bucket,
            Key: key,
        };
        logger.info(`exists,params: ${JSON.stringify(params)}`)
        try {
            const info = await s3Client.headObject(params).promise();
            logger.info(`exists,File Exists: ${JSON.stringify(info)}`);
            return true;
        } catch (err) {
            if (err.statusCode === 404) {
                return false
            }
            throw Error(`S3Service.exists> There was an error getting information on the file ${key}, for ${bucket}, Error: ${JSON.stringify(err)}`);
        }
    }

    async uploadObj (bucketName, sourceFileName, targetFileName, logParams){
        const logger = loggerUtils.customLogger( EventName, logParams);
        try {
            const fsPromises = fs.promises;
            const data = await fsPromises.readFile(sourceFileName, 'utf-8');
            logger.info(`S3Service,uploadObj,sourceFileName ${sourceFileName} targetFileName ${targetFileName}`)
            const uploadParams = {
                Bucket: bucketName,
                Key: targetFileName,
                Body: data
            };
            const uploadRes = await s3Client.upload(uploadParams).promise()
            logger.info(`S3Service,uploadObj,uploadRes ${JSON.stringify(uploadRes)}`)
            return SUCCESS;
        } catch (err) {
            logger.error(`getText,ERROR in getObj catch ${JSON.stringify(err.stack)}`)
            return FAILURE;
        }
    }
  
    async TBD_uploadObj (bucketName, sourceFileName, targetFileName, logParams){
        const logger = loggerUtils.customLogger( EventName, logParams);
        try {
            logger.info(`S3Service,uploadObj,sourceFileName ${sourceFileName} targetFileName ${targetFileName}`)
            fs.readFile(sourceFileName, function (err, data) {
                if (err) { throw err; }
                const uploadParams = {
                    Bucket: bucketName,
                    Key: targetFileName,
                    Body: data.toString('utf-8')
                };

                s3Client.upload(uploadParams, (s3Err, data) => {
                    if (s3Err) { throw s3Err }
                    logger.info(`S3Service,uploadObj,File uploaded successfully at ${data.Location}`)
                    //delete the sourcefile from temp Dir
                    // fs.unlink(sourceFileName, (err) => {
                    //     if (err) {
                    //         throw err;
                    //     }
                    //     logger.info(`S3Service,uploadObj,Source File '${sourceFileName}' hes been deleted successfully.`)
                    //     return SUCCESS;
                    // });
                });
            });
        } catch (err) {
            logger.error(`getText,ERROR in getObj catch ${JSON.stringify(err.stack)}`)
            throw Error(`S3Service.getText, Failed to get file ${sourceFileName}, from ${bucketName}, Error: ${JSON.stringify(err)}`);
        }
    }
   
}

module.exports = S3Service;