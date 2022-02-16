'use strict';

const AWS = require('aws-sdk');
AWS.config.update({ region: 'us-east-1' })
const loggerUtils = require('../common/logger-utils');
const IdServiceShared = require('../common/id-service')

const EventName = 'SQS_SERVICE'
const messageGroupId = 'esMD-SS-Worker'
let sqs = new AWS.SQS({ apiVersion: '2012-11-05' })

let instance = null;

class SqsService{
    static getInstance()
    {
        if(!instance){
            instance = new SqsService();
        }
        return instance;
    }
    
    async sendMessage(msgBody, targetQueueQRL, logParams) {
        const logger = loggerUtils.customLogger( EventName, logParams);
        try {
            const messageDeduplicationId = IdServiceShared.getInstance().getId();
            logger.info(`sendMessage, targetQueueQRL ${targetQueueQRL} msgBody: ${msgBody}  new messageDeduplicationId: ${messageDeduplicationId}`)
            const sendMsgParams = {
                MessageBody: JSON.stringify(msgBody),
                QueueUrl: targetQueueQRL,
                MessageGroupId: messageGroupId,
                MessageDeduplicationId: messageDeduplicationId,
            }
            logger.info(`sendMessage, sendMsgParams: ${JSON.stringify(sendMsgParams)}`)
            const messageAcknowledge = await sqs.sendMessage(sendMsgParams).promise();
            logger.debug(`sendMessage, messageAcknowledge: ${JSON.stringify(messageAcknowledge)}`)
            return messageAcknowledge;
        } catch (err) {
            logger.error(`sendMessage, ERROR in sendMessage catch ${JSON.stringify(err.stack)} `)
            throw Error(`SqsService, Failed to sendMessage to Queue ${targetQueueQRL}, Error: ${JSON.stringify(err)}`);
        }
    }
}

module.exports = SqsService;