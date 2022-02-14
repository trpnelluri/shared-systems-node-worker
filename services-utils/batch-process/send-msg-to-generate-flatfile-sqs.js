'use strict'

const AWS = require('aws-sdk')
const loggerUtils = require('../../sharedLib/common/logger-utils');
const IdServiceShared = require('../../sharedLib/common/id-service')

AWS.config.update({ region: 'us-east-1' })
let sqs = new AWS.SQS({ apiVersion: '2012-11-05' })
const EventName = 'SEND_MESSAGE_TO_GEN_FF_SQS'
const messageGroupId = 'esMDtoDC_FlatFile'

const targetQueueQRL = process.env.ss_req_gen_flatfile_sqs_url

async function sendMsgToGenerateFlatfileSQS (msgBody) {

    const logger = loggerUtils.customLogger( EventName, {});

    return new Promise((resolve, reject) => {
        logger.info(`sendMsgToGenerateFlatfileSQS, targetQueueQRL ${targetQueueQRL} msgBody: ${JSON.stringify(msgBody)} `)
        const messageDeduplicationId = IdServiceShared.getInstance().getId();
        logger.info(`sendMsgToGenerateFlatfileSQS, new messageDeduplicationId: ${messageDeduplicationId}`)
        const sendMsgParams = {
            MessageBody: JSON.stringify(msgBody),
            QueueUrl: targetQueueQRL,
            MessageGroupId: messageGroupId,
            MessageDeduplicationId: messageDeduplicationId,
        }
        logger.info(`sendMsgToGenerateFlatfileSQS, sendMsgParams: ${JSON.stringify(sendMsgParams)}`)
                            
        sqs.sendMessage(sendMsgParams, function(err, data) {
            if (err) { // an error occurred
                logger.error(`sendMsgToGenerateFlatfileSQS, sendMessage Error ${err.stack}`);
                let response = {
                    status: 'failure'
                }
                reject(response)
            } else {
                logger.info(`sendMsgToGenerateFlatfileSQS, Successfully placed a message in queue: ${targetQueueQRL}`);
                let response = {
                    status: 'success'
                }
                resolve(response)
            }
        })
    }).catch((error) => {
        logger.error(`sendMsgToGenerateFlatfileSQS, ERROR: ${error}` )
    });
}

module.exports = {
    sendMsgToGenerateFlatfileSQS,
};