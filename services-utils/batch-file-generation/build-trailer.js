'use strict';

const loggerUtils = require('../../sharedLib/common/logger-utils');
const { convertObjDataToFlatFileRecord } = require('../../sharedLib/common/convert-json-obj-to-flatfile-record')

const EventName = 'BUILD_TRAILER'

async function buildTrailerData (messageDataObj, rowsCount, s3ConfigInfo) {
    const logParams = {}
    const logger = loggerUtils.customLogger(EventName, logParams);
    
    try {
        const trailerObj = [{
            'recordtypeindicator': messageDataObj.clm_type_ind,
            'totalnoofrecordsfromesmd': rowsCount,
            'filler': ''
        }]
        logger.info(`buildTrailerData, trailerObj: ${JSON.stringify(trailerObj)}`)
        const trailerData = convertObjDataToFlatFileRecord(trailerObj, '', s3ConfigInfo.configfolder, s3ConfigInfo.trailerobj )
        logger.info(`buildTrailerData, trailerData: ${trailerData}`)
        return trailerData

    } catch(err) {
        logger.error(`buildTrailerData, ERROR: ${err.stack}` )
        throw Error(`buildTrailerData, ERROR in Catch: ${JSON.stringify(err)}`);
    }
  
}

module.exports = {
    buildTrailerData,
}