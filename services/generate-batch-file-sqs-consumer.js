'use strict';

/**
 *  This is an esMD sqs consumer serivce to handle the SQS message processing and insert the data into appropriate tables in postgre-sql database.
 * 
 *  @author Siva Nelluri
 *	@date 02/07/2021
 *	@version 1.0.0
 * 
*/

const { Consumer } = require('sqs-consumer');
const AWS = require('aws-sdk');
const https = require('https')
const loggerUtils = require('../sharedLib/common/logger-utils');
const ProcessBatchFileMsg = require('../services-utils/batch-file-generation/process-batch-file-message');
const EventName = 'CREATE_BATCH_FILE_SERVICE'

function generateBatchFileService () {

    let logParams = {globaltransid: '', messageid: '' };
    let logger = loggerUtils.customLogger(EventName, logParams);
      
    
    const SQSURL = process.env.ss_req_gen_flatfile_sqs_url
    const pollingWaitTime = process.env.gen_flatfile_consumer_poll_wait_time_ms;
    const batchSizeToProcess = process.env.gen_flatfile_msgs_batch_size
    const reqQueueDetails = {
        auditqueueurl: process.env.audit_queue_url,
        notificationqueueurl: process.env.notification_sqs_url
    }
    logger.info(`generateBatchFileService,SQSURL is: ${SQSURL} pollingWaitTime: ${pollingWaitTime}ms reqQueueDetails: ${JSON.stringify(reqQueueDetails)}`);
    
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
            logger.debug(`generateBatchFileService,Messages: ${JSON.stringify(messages)}`)
            if ( messages.length > 0 ) {
                for (let i = 0; i < messages.length; i++) {
                    let batchFileDataObj = JSON.parse(messages[i].Body);
                    logger.info(`generateBatchFileService,JSON.stringify(batchFileDataObj): ${JSON.stringify(batchFileDataObj)}`)
                    const { MessageId, ReceiptHandle } = messages[i];
                    const MessageDeduplicationId = messages[i].Attributes.MessageDeduplicationId
                    logger.debug(`generateBatchFileService,MessageId: ${MessageId} MessageDeduplicationId: ${MessageDeduplicationId} ReceiptHandle: ${ReceiptHandle}`)
                    await ProcessBatchFileMsg.processBatchFileSQSMessage(batchFileDataObj, reqQueueDetails)
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
        logger.error(`generateBatchFileService,Error in Generate BatchFile Consumer: ${err.message}`);
    });
  
    app.on('processing_error', (err) => {
        logger.error(`generateBatchFileService,processing_error in Generate BatchFile Consumer: ${err.stack}`);
    });

    app.on('timeout_error', (err) => {
        logger.error(`generateBatchFileService,timeout_error in Generate BatchFile Consumer: ${err.stack}`);
    });

    app.on('message_processed', (err) => {
        logger.info('generateBatchFileService,message_processed Successfully in Generate BatchFile Consumer');
    });
  
    app.start();
    
    process.on('SIGINT', () => {
        logger.info('genPAReqBatchFileService, SIGINT Received stopping Generate BatchFile Consumer');
        logger.clear();
        app.stop();
        setTimeout(process.exit, 5000);
    });

}

module.exports = {
    generateBatchFileService,
};