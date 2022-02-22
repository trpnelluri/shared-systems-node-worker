'use strict';

const loggerUtils = require('../../sharedLib/common/logger-utils');
const dateTimeUtils = require('../../sharedLib/common/date-time-utils')
const CommonUtils = require('../../sharedLib/common/common-utils');
const { getAvailableDataFromDB } = require('../../sharedLib/common/get-available-data-from-db');
const { buildHeaderData } = require('./build-header')
const { buildTrailerData } = require('./build-trailer')
const { populateBatchFileName } = require('./populate-batch-file-name')
const { generateBatchFileToDC } = require('./generate-batch-file-and-deliver-to-dc')

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
            const batchFileFor = msgData.clm_type_id.toString()
            const recordTypeIndi = msgData.clm_type_ind
            const dataCenterID = msgData.data_cntr_id
            const valsToReplace = ['YYYYMMDD', recordTypeIndi, dataCenterID]
            const batchData = await getAvailableDataFromDB (logParams, valsToReplace, requiredEnvData, PostgresDBSevice)
            const genSrvcregBatchId = requiredEnvData.batchfileforsrvcregid
            const genDcfBatchId = requiredEnvData.batchfilefordcfid
            logger.info(`processBatchFileSQSMessage, batchData.length: ${batchData.length}`);
            if ( batchData.length ) {
                logger.info(`processBatchFileSQSMessage, batchFileFor: ${batchFileFor} genSrvcregBatchId: ${genSrvcregBatchId} genDcfBatchId: ${genDcfBatchId}`);
                const dateTimeData = await dateTimeUtils.formattedDateTime(logger)
                const dateTimeDataArray = dateTimeData.split('^')
                const formattedDateTime = dateTimeDataArray[0]
                const dateToday = dateTimeDataArray[1]
                if ( genSrvcregBatchId === batchFileFor ) {
                    logger.info(`processBatchFileSQSMessage, genSrvcregBatchId: ${genSrvcregBatchId}`);
                } else if (genDcfBatchId === batchFileFor ) {
                    logger.info(`processBatchFileSQSMessage, genDcfBatchId: ${genDcfBatchId}`);
                } else {
                    logger.info(`processBatchFileSQSMessage, genPaReqBatchId: ${batchFileFor}`);
                    const s3ConfigInfo = {
                        configfolder: process.env.pareqconfigfolder,
                        headerobj: process.env.headerobj,
                        trailerobj: process.env.trailerobj,
                    }
                    const batchFileName = await populateBatchFileName(msgData.fil_name_tmplt, formattedDateTime)
                    logger.info(`processBatchFileSQSMessage, batchData.length: ${batchData.length} batchFileFor ${batchFileFor} s3ConfigInfo: ${JSON.stringify(s3ConfigInfo)} formattedDateTime: ${formattedDateTime} batchFileName: ${batchFileName}`);
                    //NOTE: The following 'no_of_records' attribute value will be used in trailer Object
                    //meta data obj update - start
                    //msgData.no_of_records = batchData.length
                    let noOfRecords = batchData.length
                    noOfRecords = await CommonUtils.padLeadingZeros(noOfRecords, 5)
                    msgData.no_of_records = noOfRecords
                    msgData.batch_cycle_date = formattedDateTime
                    //updating the dataCenterID
                    let dataCenterID = await CommonUtils.padLeadingZeros(msgData.data_cntr_id, 3)
                    msgData.data_cntr_id_pad = dataCenterID
                    //meta data obj update - End
                    const headerData = await buildHeaderData(msgData, s3ConfigInfo )
                    const trailerData = await buildTrailerData(msgData, s3ConfigInfo)
                    logger.info(`processBatchFileSQSMessage, headerObj: ${headerData.length} trailerObj: ${trailerData.length} dateToday: ${dateToday}`);
                    const batchStatus = await generateBatchFileToDC(batchFileName, headerData, batchData, trailerData, dateToday)
                    logger.info(`processBatchFileSQSMessage, batchStatus: ${batchStatus}`)
                }
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