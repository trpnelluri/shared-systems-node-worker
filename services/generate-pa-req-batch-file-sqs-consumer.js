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

function genPAReqBatchFileService (PostgresDBSevice) {

    const SQSURL = process.env.ss_req_gen_flatfile_sqs_url
    const pollingWaitTime = process.env.gen_flatfile_consumer_poll_wait_time_ms;
    const batchSizeToProcess = process.env.gen_flatfile_msgs_batch_size

    const requiredEnvData = {
        tablename: process.env.pareqtodcdatatable,
        colstouseinrefsql: process.env.db_cols_to_get_data_for_batch,
        refsql: process.env.ref_sql_to_get_data_for_batch,
        refsqlreplacevals: process.env.ref_sql_replace_attributes,
        batchfileforsrvcregid: process.env.batch_file_for_srvcreg_id,
        batchfilefordcfid: process.env.batch_file_for_dcf_id
    }
         
    let logParams = {globaltransid: '', messageid: '' };
    let logger = loggerUtils.customLogger(EventName, logParams);
      
    logger.info(`genPAReqBatchFileService, SQSURL is: ${SQSURL} pollingWaitTime: ${pollingWaitTime}ms requiredEnvData: ${JSON.stringify(requiredEnvData)}}`);
    
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
            logger.debug(`genPAReqBatchFileService, Messages: ${messages}`)
            if ( messages.length > 0 ) {
                for (let i = 0; i < messages.length; i++) {
                    let batchFileDataObj = JSON.parse(messages[i].Body);
                    logger.info(`genPAReqBatchFileService, JSON.stringify(batchFileDataObj): ${JSON.stringify(batchFileDataObj)}`)
                    const { MessageId, ReceiptHandle } = messages[i];
                    const MessageDeduplicationId = messages[i].Attributes.MessageDeduplicationId
                    logger.debug(`genPAReqBatchFileService, MessageId: ${MessageId} MessageDeduplicationId: ${MessageDeduplicationId} ReceiptHandle: ${ReceiptHandle}`)
                    await ProcessBatchFileMsg.processBatchFileSQSMessage(batchFileDataObj, requiredEnvData, PostgresDBSevice)
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
        logger.error(`genPAReqBatchFileService, Error in Audit Trans Consumer: ${err.message}`);
    });
  
    app.on('processing_error', (err) => {
        logger.error(`genPAReqBatchFileService, processing_error in Audit Trans Consumer: ${err.stack}`);
    });

    app.on('timeout_error', (err) => {
        logger.error(`genPAReqBatchFileService, timeout_error in Audit Trans Consumer: ${err.stack}`);
    });

    app.on('message_processed', (err) => {
        logger.info('genPAReqBatchFileService, message_processed Successfully in Audit Trans Consumer');
    });
  
    app.start();
    
    process.on('SIGINT', () => {
        logger.info('genPAReqBatchFileService, SIGINT Received stopping Audit Trans consumer');
        logger.clear();
        app.stop();
        setTimeout(process.exit, 5000);
    });

}

module.exports = {
    genPAReqBatchFileService,
};