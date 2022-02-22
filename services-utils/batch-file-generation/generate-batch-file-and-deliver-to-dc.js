'use strict';

const loggerUtils = require('../../sharedLib/common/logger-utils');
const { createBatchFile } = require('../../sharedLib/common/create-batch-file');

const EventName = 'GENERATE_BATCH_FILE_TO_DC'

async function generateBatchFileToDC (batchFileName, headerData, batchData, trailerData, dateToday) {
    const logParams = {}
    const logger = loggerUtils.customLogger(EventName, logParams);
    const tempFolder = 'C:/CMS/esMD/AWS_Details/Shared_Systems_Files_Process/Pa_Req/'
    batchFileName = tempFolder + batchFileName
    try {
        logger.info('generateBatchFileToDC started')
        const createBatFile = await createBatchFile(batchFileName)
        createBatFile.write(headerData + '\r\n')
        let k = 0;
        for (k = 0; k < batchData.length; k++) {
            let bodyRecord = batchData[k].flat_fil_rec_obj
            const dateFromBodyRec = bodyRecord.substring(6, 14)
            logger.info(`generateBatchFileToDC, dateFromBodyRec: ${dateFromBodyRec} dateToday: ${dateToday}`)
            if ( dateToday !== dateFromBodyRec ) {
                bodyRecord = bodyRecord.replace(dateFromBodyRec, dateToday)
            }
            createBatFile.write(bodyRecord + '\r\n')
        }
        createBatFile.write(trailerData)
        createBatFile.close();
        logger.info('generateBatchFileToDC, Completed Successfully')
        return 'SUCCESS'
    } catch(err) {
        logger.error(`generateBatchFileToDC, ERROR in catch: ${err.stack}`);
        throw new Error('generateBatchFileToDC Completed with errors.');
    }
}

module.exports = {
    generateBatchFileToDC,
}