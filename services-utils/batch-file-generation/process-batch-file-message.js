'use strict';

const loggerUtils = require('../../sharedLib/common/logger-utils');
const dateTimeUtils = require('../../sharedLib/common/date-time-utils')
const { getAvailableDataFromDB } = require('../../sharedLib/common/get-available-data-from-db');
const { buildHeaderData } = require('./build-header')
const { buildTrailerData } = require('./build-trailer')

const EventName = 'PROCESS_BATCHFILE_MSG'

async function processBatchFileSQSMessage (messageDataObj, requiredEnvData, PostgresDBSevice) {
    const logParams = {}
    const logger = loggerUtils.customLogger(EventName, logParams);
    logger.info(`processBatchFileSQSMessage,  messageData : ${JSON.stringify(messageDataObj)}`)
    try {
        let i = 0;
        for (i = 0; i < messageDataObj.length; i++) {
            logger.info(`processBatchFileSQSMessage, messageDataObj : ${messageDataObj[i]} messageData: ${JSON.stringify(messageDataObj[i])}`);
            const msgData = messageDataObj[i]
            const batchFileFor = msgData.clm_type_id
            const recordTypeIndi = msgData.clm_type_ind
            const dataCenterID = msgData.data_cntr_id
            const valsToReplace = ['YYYYMMDD', recordTypeIndi, dataCenterID]
            const batchData = await getAvailableDataFromDB (logParams, valsToReplace, requiredEnvData, PostgresDBSevice)
            logger.info(`processBatchFileSQSMessage, batchData.length: ${batchData.length}`);
            if ( batchData.length ) {
                const s3ConfigInfo = {
                    configfolder: process.env.pareqconfigfolder,
                    headerobj: process.env.headerobj,
                    trailerobj: process.env.trailerobj,
                }
                const formattedDateTime = await dateTimeUtils.formattedDateTime(logger)
                logger.info(`processBatchFileSQSMessage, batchData.length: ${batchData.length} batchFileFor ${batchFileFor} s3ConfigInfo: ${JSON.stringify(s3ConfigInfo)} formattedDateTime: ${formattedDateTime}`);
                //NOTE: The following 'no_of_records' attribute value will be used in trailer Object
                msgData.no_of_records = batchData.length
                msgData.batch_cycle_date = formattedDateTime
                const headerData = await buildHeaderData(msgData, s3ConfigInfo )
                const trailerData = await buildTrailerData(msgData, s3ConfigInfo)
                logger.info(`processBatchFileSQSMessage, headerObj: ${headerData.length} trailerObj: ${trailerData.length}`);
            }
        }

    } catch (err) {
        logger.error(`processBatchFileSQSMessage, Error in Processing the message: ${err.stack}`);
        throw new Error('processBatchFileSQSMessage, Completed with errors.');
    }
    
}

module.exports = {
    processBatchFileSQSMessage,
}