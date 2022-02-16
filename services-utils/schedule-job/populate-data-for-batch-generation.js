'use strict';

const loggerUtils = require('../../sharedLib/common/logger-utils');
//const { getRequiredDataForBatchfile } = require('./get-req-data-for-batch')
const { getAvailableDataFromDB } = require('../../sharedLib/common/get-available-data-from-db');
const SQSServiceShared = require('../../sharedLib/aws/sqs-service');

const EventName = 'POPULATE_DATA_FOR_BATCHFILE'
const targetQueueQRL = process.env.ss_req_gen_flatfile_sqs_url

async function populateDataForBatchFileGeneration (PostgresDBSevice) {
    let logParams = {}
    const logger = loggerUtils.customLogger(EventName, logParams)
    try{
        const dateToday = new Date();
        let hours = dateToday.getHours()
        logger.info (`getRequiredDataForBatchfile, hours: ${hours}`)
        if (hours < 10) {
            hours = '0' + hours
        }
        const valsToReplace = ['HH24', 'HH24', hours];
        const requiredEnvData = {
            refsql: process.env.ref_sql_pa_req_batch_data
        }
        //const response = await getRequiredDataForBatchfile (PostgresDBSevice)
        const response = await getAvailableDataFromDB (logParams, valsToReplace, requiredEnvData, PostgresDBSevice)
        logger.info(`populateDataForBatchFileGeneration, responselength: ${response.length}`)
        if ( response.length ) {
            const sendMsgRes = await SQSServiceShared.getInstance().sendMessage(response, targetQueueQRL, logParams);
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