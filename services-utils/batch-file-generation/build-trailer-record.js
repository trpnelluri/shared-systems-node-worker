'use strict';

const loggerUtils = require('../../sharedLib/common/logger-utils');
const { convertObjDataToFlatFileRecord } = require('../../sharedLib/common/convert-json-obj-to-flatfile-record')

const EventName = 'BUILD_TRAILER_RECORD'
const trailerAttributes = process.env.pa_req_trailer_data

async function buildTrailerRecord (messageDataObj, s3ConfigInfo) {
    const logParams = {}
    const logger = loggerUtils.customLogger(EventName, logParams);
    try {
        let trailerArray = [];
        let trailerObj = new Object;
        const trailerAttributesObj = trailerAttributes.split(',');
        trailerAttributesObj.forEach((element) => {
            logger.info(`buildTrailerRecord,  element: ${element}`)
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
        logger.info(`buildTrailerRecord, trailerObj: ${JSON.stringify(trailerArray)}`)
        const trailerRecord = convertObjDataToFlatFileRecord(trailerArray, '', s3ConfigInfo.configfolder, s3ConfigInfo.trailerobj )
        logger.info(`buildTrailerRecord, trailerRecord: ${trailerRecord}`)
        return trailerRecord
    } catch(err) {
        logger.error(`buildTrailerRecord, ERROR: ${err.stack}` )
        throw Error(`buildTrailerRecord, ERROR in Catch: ${JSON.stringify(err)}`);
    }
}

module.exports = {
    buildTrailerRecord,
}