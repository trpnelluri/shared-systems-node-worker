'use strict'

const checkHolidays = require('../sharedLib/common/holiday-check');
const loggerUtils = require('../sharedLib/common/logger-utils');

const EventName = 'POPUALTE_DATA'
const logger = loggerUtils.customLogger( EventName, {});

function populateData () {
    let isHolidayToday = checkHolidays.isHolidayToday()  // This method Should call only once in Day.

    if ( isHolidayToday ) {
        logger.info(`populateData, isHolidayToday: ${isHolidayToday}` )
        return isHolidayToday;
    } else {
        logger.info(`populateData, else isHolidayToday: ${isHolidayToday}` )
        return isHolidayToday;
    }

    /*
    try {
        const bodyObjName = await populateKeyName(glblUniqId, configFolder, paReqBodyObjName)
        logger.debug(`processPAReqSQSMsg, keyName: ${bodyObjName}`);
        let mapPAReqBodyObj = await fetchJSONObjFromS3Config(bodyObjName);
        logger.info(`processPAReqSQSMsg, mapPAReqBodyObj: ${JSON.stringify(mapPAReqBodyObj)}`);
        const paReqDataObj = payload.ffdata
        logger.info(`processPAReqSQSMsg, paReqDataObj: ${JSON.stringify(paReqDataObj)}`);
        const paReqFFRecData = fixy.unparse(mapPAReqBodyObj, paReqDataObj)
        logger.info(`processPAReqSQSMsg, paReqFFRecData: ${JSON.stringify(paReqFFRecData)}`);
    } catch (err) {
        logger.error(`processPAReqSQSMsg, ERROR: : ${err.stack}` )
    }
    */
    
}



module.exports = {
    populateData,
};