'use strict';

const loggerUtils = require('../../sharedLib/common/logger-utils');
const { getRequiredDataForBatchfile } = require('./get-req-data-for-batch')
//const { sendMsgToGenerateFlatfileSQS } = require('./send-msg-to-generate-flatfile-sqs');
const SQSServiceShared = require('../../sharedLib/aws/sqs-service');

const EventName = 'POPULATE_DATA_FOR_BATCHFILE'
const targetQueueQRL = process.env.ss_req_gen_flatfile_sqs_url

async function populateDataForBatchFileGeneration (PostgresDBSevice) {
    const logger = loggerUtils.customLogger(EventName, {});
    try{
        const response = await getRequiredDataForBatchfile (PostgresDBSevice)
        logger.info(`populateDataForBatchFileGeneration, responselength: ${response.length}`)
        if ( response.length ) {
            const sendMsgRes = await SQSServiceShared.getInstance().sendMessage(response, targetQueueQRL );
            //let sednMesageStatus = await sendMsgToGenerateFlatfileSQS(response)
            logger.info(`populateDataForBatchFileGeneration, sednMesageStatus: ${JSON.stringify(sendMsgRes)}`)
        } else {
            logger.info('populateDataForBatchFileGeneration, Data not available to generate flatfile at this time')
        }
    } catch(err) {
        logger.error(`populateDataForBatchFileGeneration, ERROR in catch: ${err.stack}`)
    }
}
module.exports = {
    populateDataForBatchFileGeneration,
}