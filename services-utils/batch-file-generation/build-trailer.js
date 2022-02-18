'use strict';

const loggerUtils = require('../../sharedLib/common/logger-utils');
const { convertObjDataToFlatFileRecord } = require('../../sharedLib/common/convert-json-obj-to-flatfile-record')

const EventName = 'BUILD_TRAILER'
const trailerAttributes = process.env.pa_req_trailer_data

async function buildTrailerData (messageDataObj, s3ConfigInfo) {
    const logParams = {}
    const logger = loggerUtils.customLogger(EventName, logParams);
    try {
        let trailerArray = [];
        let trailerObj = new Object;
        const trailerAttributesObj = trailerAttributes.split(',');
        trailerAttributesObj.forEach((element) => {
            logger.info(`buildTrailerData,  element: ${element}`)
            const trailerAttribute = element.toLowerCase().trim()
            const trailerAttrArray = trailerAttribute.split('^')
            const trailerAttri = trailerAttrArray[0]
            const trailerAttriVal = trailerAttrArray[1]
            if (trailerAttriVal !== 'null' ) {
                trailerObj[trailerAttri] = messageDataObj[trailerAttriVal]
            } else {
                trailerObj[trailerAttri] = ''
            }
        });
        trailerArray.push(trailerObj)
        logger.info(`buildTrailerData, trailerObj: ${JSON.stringify(trailerArray)}`)
        const trailerData = convertObjDataToFlatFileRecord(trailerArray, '', s3ConfigInfo.configfolder, s3ConfigInfo.trailerobj )
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