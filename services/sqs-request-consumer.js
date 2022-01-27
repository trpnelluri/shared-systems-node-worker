'use strict';

const { Consumer } = require('sqs-consumer');
const AWS = require('aws-sdk');
const https = require('https')
const loggerUtils = require('../sharedLib/common/logger-utils');
const EventName = 'REQUEST_CONSUMER'

function start_SS_Req_Sqs_Service () {

    const SQSURL = process.env.ss_req_sqs_url
    const pollingWaitTime = process.env.ss_req_consumer_polling_wait_time_ms;
    const batchSizeToProcess = process.env.req_msgs_batch_size
         
    let logParams = {globaltransid: '', messageid: '' };
    const logger = loggerUtils.customLogger(EventName, logParams);
      
    logger.info(`start_SS_Req_Sqs_Service, SQSURL is: ${SQSURL} pollingWaitTime: ${pollingWaitTime}ms }`);

    const app = Consumer.create({
        queueUrl: SQSURL,
        attributeNames: [
            'All'
        ],
        messageAttributeNames: [
            'All'
        ],
        batchSize: batchSizeToProcess,
        pollingWaitTimeMs: pollingWaitTime, //5 seconds and it's configurable
        handleMessageBatch: async (messages) => {
            logger.debug(`start_SS_Req_Sqs_Service, Messages: ${messages}`)
            if ( messages.length > 0 ) {
                for (let i = 0; i < messages.length; i++) {
                    logger.info('start_SS_Req_Sqs_Service, Message from queue : ' + JSON.stringify(messages[i]));
                    //TBD let messageDataobj = JSON.parse(messages[i].Body);  
                    //TBD const { transaction_id } = messageDataobj[0]; //This value is glbl_uniq_id in esMD
                    const { MessageId, ReceiptHandle } = messages[i];
                    const MessageDeduplicationId = messages[i].Attributes.MessageDeduplicationId
                    //NOTE: If we are moving the message from DLQ to Main Queue we need to update the MessageDeduplicationId to process it again in main queue.
                    logger.info(`start_SS_Req_Sqs_Service,  MessageId: ${MessageId} ReceiptHandle: ${ReceiptHandle}  MessageDeduplicationId: ${MessageDeduplicationId}`);
                    //await ProcessMesssage.processSQSMessage(message, transaction_id, MessageId, requiredEnvData)
                }
            }
        },
        sqs: new AWS.SQS({
            httpOptions: {
                agent: new https.Agent({
                    keepAlive: true
                })
            }
        })
    });

    app.on('error', (err) => {
        logger.error(`start_SS_Req_Sqs_Service, Error in Audit Trans Consumer: ${err.message}`);
    });
  
    app.on('processing_error', (err) => {
        logger.error(`start_SS_Req_Sqs_Service, processing_error in Audit Trans Consumer: ${err.stack}`);
    });

    app.on('timeout_error', (err) => {
        logger.error(`start_SS_Req_Sqs_Service, timeout_error in Audit Trans Consumer: ${err.stack}`);
    });

    app.on('message_processed', (err) => {
        logger.info('start_SS_Req_Sqs_Service, message_processed Successfully in Audit Trans Consumer');
    });
  
    app.start();
    
    process.on('SIGINT', () => {
        logger.info('start_SS_Req_Sqs_Service, SIGINT Received stopping Audit Trans consumer');
        logger.clear();
        app.stop();
        setTimeout(process.exit, 10000);
    });

}

module.exports = {
    start_SS_Req_Sqs_Service,
};