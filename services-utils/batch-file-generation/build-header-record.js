'use strict';

const loggerUtils = require('../../sharedLib/common/logger-utils');
const { convertObjDataToFlatFileRecord } = require('../../sharedLib/common/convert-json-obj-to-flatfile-record')

const EventName = 'BUILD_HEADER_RECORD'
const headerAttributes = process.env.pa_req_header_data

async function buildHeaderRecord (messageDataObj, s3ConfigInfo) {
    const logParams = {}
    const logger = loggerUtils.customLogger(EventName, logParams);
    try {
        let headerArray = [];
        let headerObj = new Object;
        const headerAttributesObj = headerAttributes.split(',');
        headerAttributesObj.forEach((element) => {
            logger.info(`buildHeaderRecord,  element: ${element}`)
            const headerAttribute = element.toLowerCase().trim()
            const headerAttrArray = headerAttribute.split('^')
            const headerAttri = headerAttrArray[0]
            const headerAttriVal = headerAttrArray[1]
            if (headerAttriVal !== 'null' ) {
                headerObj[headerAttri] = messageDataObj[headerAttriVal]
            } else {
                headerObj[headerAttri] = ''
            }
        });
        headerArray.push(headerObj)
        logger.info(`buildHeaderRecord, headerArray: ${JSON.stringify(headerArray)}`)
        const headerRecord = await convertObjDataToFlatFileRecord(headerArray, '', s3ConfigInfo.configfolder, s3ConfigInfo.headerobj )
        logger.info(`buildHeaderRecord, headerRecord: ${headerRecord}`)
        return headerRecord
    } catch (err) {
        logger.error(`buildHeaderRecord, ERROR: ${err.stack}` )
        throw Error(`buildHeaderRecord, ERROR in Catch: ${JSON.stringify(err)}`);
    }
}

module.exports = {
    buildHeaderRecord,
}