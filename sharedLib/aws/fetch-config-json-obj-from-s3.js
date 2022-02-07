'use strict'

const AWS = require('aws-sdk');
const s3 = new AWS.S3();
const bucket = process.env.bucketname;

async function fetchJSONObjFromS3Config(objectKey){
    try {
        const params = {
            Bucket: bucket,
            Key: objectKey
        }
        const data = await s3.getObject(params).promise();
        //let buf = Buffer.from(data.Body);
        //let str = buf.toString('utf-8');
        //console.log('str: ' + str)
        let strData = data.Body.toString('utf-8');
        let objData = JSON.parse(strData); // passing the buffer directly will have it converted to string
        console.log('0: ' + objData)
        return objData
    } catch (e) {
        throw new Error(`Could not retrieve file from S3: ${e.stack}`)
    }
}
module.exports = {
    fetchJSONObjFromS3Config
};