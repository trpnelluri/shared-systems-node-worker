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
        let headerObj;
        const headerAttributesObj = headerAttributes.split(',');
        headerAttributesObj.forEach((element) => {
            logger.info(`buildHeaderData,  element: ${element}`)
            const headerAttribute = element.toLowerCase().trim()
            const headerAttrArray = headerAttribute.split('^')
            //const headerAttri = headerAttrArray[0]
            const headerAttriVal = headerAttrArray[1]
            if (headerAttriVal !== 'null' ) {
                headerObj.headerAttrArray[0] = messageDataObj[headerAttriVal]
            } else {
                headerObj.headerAttrArray[0] = ''
            }
        });

        headerArray.push(headerObj)

        logger.info(`buildHeaderData, headerArray: ${JSON.stringify(headerArray)}`)
        const headerData = await convertObjDataToFlatFileRecord(headerArray, '', s3ConfigInfo.configfolder, s3ConfigInfo.headerobj )
        logger.info(`buildHeaderData, headerData: ${headerData}`)
        return headerData

        /*
        const headerObj = [{
            'recordtypeindicator': messageDataObj.clm_type_ind,
            'datacenterid': messageDataObj.data_cntr_id,
            'batchcycledate': messageDataObj.strt_by_date,
            'typeoftransaction': messageDataObj.clm_type_name,
            'filler': ''
        }]
        logger.info(`buildHeaderObj, headerObj: ${JSON.stringify(headerObj)}`)
        const headerData = await convertObjDataToFlatFileRecord(headerObj, '', s3ConfigInfo.configfolder, s3ConfigInfo.headerobj )
        logger.info(`buildHeaderObj, headerData: ${headerData}`)
        return headerData
        */

    } catch (err) {
        logger.error(`buildHeaderData, ERROR: ${err.stack}` )
        throw Error(`buildHeaderData, ERROR in Catch: ${JSON.stringify(err)}`);
    }

}

module.exports = {
    buildHeaderData,
}