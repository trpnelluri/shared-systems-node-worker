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
    
}

module.exports = {
    populateData,
};