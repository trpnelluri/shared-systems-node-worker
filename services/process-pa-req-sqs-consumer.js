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
const ProcessPARequest = require('../services-utils/pa-requests/process-pa-request');
const EventName = 'PROCESS_PA_REQUEST_SERVICE'

function processPARequestService (PostgresDBSevice) {

    const SQSURL = process.env.ss_pa_req_sqs_url
    const pollingWaitTime = process.env.ss_req_consumer_polling_wait_time_ms;
    const batchSizeToProcess = process.env.req_msgs_batch_size

    const requiredEnvData = {
        tablename: process.env.pareqtodcdatatable,
        columns: process.env.pareqinsertcolumns,
        additionalcols: process.env.pareqadditionalcolumns,
        metadataattribute:process.env.pareqaddidataattribute,
        auditeventdata: process.env.ss_flatfile_record_gen_audit_event
    }
         
    let logParams = {globaltransid: '', messageid: '' };
    let logger = loggerUtils.customLogger(EventName, logParams);
      
    logger.info(`processPAReqService, SQSURL is: ${SQSURL} pollingWaitTime: ${pollingWaitTime}ms }`);
    
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
            logger.debug(`processPAReqService, Messages: ${messages}`)
            if ( messages.length > 0 ) {
                for (let i = 0; i < messages.length; i++) {
                    let paReqObj = JSON.parse(messages[i].Body);
                    logger.info(`processPAReqService, JSON.stringify(paReqObj): ${JSON.stringify(paReqObj)}`)
                    const glblUniqId = paReqObj.pa_req_data[0].esmdtransactionid
                    console.log(`processPAReqService, glblUniqId: ${glblUniqId}`)
                    let logParams = {globaltransid: glblUniqId}
                    logger = loggerUtils.customLogger( EventName, logParams)
                    const { MessageId, ReceiptHandle } = messages[i];
                    const MessageDeduplicationId = messages[i].Attributes.MessageDeduplicationId
                    logger.info(`processPAReqService, MessageId: ${MessageId} MessageDeduplicationId: ${MessageDeduplicationId} ReceiptHandle: ${ReceiptHandle}`)
                    //NOTE: If we are moving the message from DLQ to Main Queue we need to update the MessageDeduplicationId to process it again in main queue.
                    await ProcessPARequest.processPAReqSQSMsg(paReqObj, glblUniqId, requiredEnvData, PostgresDBSevice)

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
        logger.error(`processPAReqService, Error in Audit Trans Consumer: ${err.message}`);
    });
  
    app.on('processing_error', (err) => {
        logger.error(`processPAReqService, processing_error in Audit Trans Consumer: ${err.stack}`);
    });

    app.on('timeout_error', (err) => {
        logger.error(`processPAReqService, timeout_error in Audit Trans Consumer: ${err.stack}`);
    });

    app.on('message_processed', (err) => {
        logger.info('processPAReqService, message_processed Successfully in Audit Trans Consumer');
    });
  
    app.start();
    
    process.on('SIGINT', () => {
        logger.info('processPAReqService, SIGINT Received stopping Audit Trans consumer');
        logger.clear();
        app.stop();
        setTimeout(process.exit, 5000);
    });

}

module.exports = {
    processPARequestService,
};