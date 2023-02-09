'use strict';

const loggerUtils = require('../../sharedLib/common/logger-utils');

const clsName = 'PopulateBatchFileNameSerivce';

let instance = null;

class PopulateBatchFileNameSerivce {

    static getInstance()
    {
        if(!instance){
            instance = new PopulateBatchFileNameSerivce();
        }
        return instance;
    }

    async populateBatchFileName (batchFileName, formattedDateTime, fileNameDate, batchFileFor, batchFileGenDir, dataCenterName ) {
        const logParams = {};
        const logger = loggerUtils.customLogger(clsName, logParams);
        try {
            logger.info(`populateBatchFileName,batchFileName: ${batchFileName} formattedDateTime: ${formattedDateTime} fileNameDate: ${fileNameDate} batchFileFor: ${batchFileFor} batchFileGenDir: ${batchFileGenDir}` )
            //const dateToday = formattedDateTime.substring(0, 8)
            const timeNow = formattedDateTime.substring(8, 14);

            if (batchFileName.indexOf('{0}') > -1) {
                batchFileName = batchFileName.replace('{0}', fileNameDate);
            }

            if (batchFileName.indexOf('{1}') > -1) {
                batchFileName = batchFileName.replace('{1}', timeNow);
            }

            const batchFileNameWithDir = batchFileGenDir + batchFileName;
            const returnData = {
                batchfilename: batchFileName,
                batchfilenamewithdir: batchFileNameWithDir
            }
            logger.info(`populateBatchFileName,returnData: ${JSON.stringify(returnData)}`);
            return returnData;
        } catch (err) {
            logger.error(`populateBatchFileName,ERROR: ${err.stack}`);
            throw Error(`populateBatchFileName, ERROR in Catch: ${JSON.stringify(err)}`);
        }
    }

}
module.exports = PopulateBatchFileNameSerivce;