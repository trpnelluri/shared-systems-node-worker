'use strict';

const AWS = require('aws-sdk');

const s3Client = new AWS.S3();

let instance = null;

class S3Service{

    static getInstance()
    {
        if(!instance){
            instance = new S3Service();
        }
        return instance;
    }

    async get(bucket, key) {
        const params = {
            Bucket: bucket,
            Key: key,
        };

        try {
            let data = await s3Client.getObject(params).promise();
            //todo: find a better suffix parsing
            if (key.slice(key.length - 4, key.length) === 'json') {
                let strData = data.Body.toString('utf-8');
                let objData = JSON.parse(strData); // passing the buffer directly will have it converted to string
                console.log(`fetchJSONObjFromS3Config, getObjParams: ${JSON.stringify(objData)}`)
                return objData
            } else {
                return data;
            }
            
        } catch (err) {
            throw Error(`S3Service.get> Failed to get file ${key}, from ${bucket}, Error: ${JSON.stringify(err)}`);
        }
    }

    async getText(bucket, key) {
        const params = {
            Bucket: bucket,
            Key: key,
        };

        try {
            let data = await s3Client.getObject(params).promise();
            return data.Body.toString();
        } catch (err) {
            throw Error(`S3Service.get> Failed to get file ${key}, from ${bucket}, Error: ${JSON.stringify(err)}`);
        }
    }

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

    async exists(bucket, key) {
        const params = {
            Bucket: bucket,
            Key: key,
        };

        try {
            const info = await s3Client.headObject(params).promise();
            console.log(`File Exists: ${JSON.stringify(info)}`);
            return true;
        } catch (err) {
            if (err.statusCode === 404) {
                return false
            }
            throw Error(`S3Service.get> There was an error getting information on the file ${key}, for ${bucket}, Error: ${JSON.stringify(err)}`);
        }
    }
}

module.exports = S3Service;