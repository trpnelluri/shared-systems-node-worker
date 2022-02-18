'use strict';

const loggerUtils = require('../../sharedLib/common/logger-utils');
const { convertObjDataToFlatFileRecord } = require('../../sharedLib/common/convert-json-obj-to-flatfile-record')

const EventName = 'BUILD_HEADER'
const headerAttributes = process.env.pa_req_header_data

async function buildHeaderData (messageDataObj, s3ConfigInfo) {
    const logParams = {}
    const logger = loggerUtils.customLogger(EventName, logParams);
    try {
        let headerArray = [];
        let headerObj = new Object;
        const headerAttributesObj = headerAttributes.split(',');
        headerAttributesObj.forEach((element) => {
            logger.info(`buildHeaderData,  element: ${element}`)
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
        logger.info(`buildHeaderData, headerArray: ${JSON.stringify(headerArray)}`)
        const headerData = await convertObjDataToFlatFileRecord(headerArray, '', s3ConfigInfo.configfolder, s3ConfigInfo.headerobj )
        logger.info(`buildHeaderData, headerData: ${headerData}`)
        return headerData

    } catch (err) {
        logger.error(`buildHeaderData, ERROR: ${err.stack}` )
        throw Error(`buildHeaderData, ERROR in Catch: ${JSON.stringify(err)}`);
    }

}

module.exports = {
    buildHeaderData,
}