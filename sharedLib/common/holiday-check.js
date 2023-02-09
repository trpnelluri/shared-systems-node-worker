'use strict'
/**
 *  This is an esMD service, used to check today is holiday or not.
 * 
 *  @author Siva Nelluri
 *	@date 01/27/2021
 *	@version 1.0.0
 * 
*/

const loggerUtils = require('./logger-utils');
const EventName = 'HOLIDAY_CHECK'

/*
The follwoing method is used to verify the holiday's for the perticular year mentioned in aws parameter store.
    retruns true if it is holiday or else it will false.
*/
function isHolidayToday(callback) {
    let isHolidayToday = false
    const todaysDate = new Date()
    const currentYear = todaysDate.getFullYear()
    const logger = loggerUtils.customLogger( EventName, {});
    const fedHolidaysData = `federal_holidays_${currentYear}`;
    //const fedHolidaysList = `process.env.federal_holidays_2022`
    const fedHolidaysList = `process.env.${fedHolidaysData}`;
    logger.info(`isHolidayToday,fedHolidaysList: ${fedHolidaysList} currentYear: ${currentYear} fedHolidaysData: ${fedHolidaysData}`)
    
    if ( fedHolidaysList !== undefined ) {
        const objFedHolidaysList = fedHolidaysList.split(',')
        objFedHolidaysList.forEach(element => {
            if ( !isHolidayToday ) {
                logger.debug(`isHolidayToday,element: ${element}`);
                const fedHolidaysData = element.trim();
                const fedHolidaysArray = fedHolidaysData.split('^');
                const holiday = fedHolidaysArray[0] // TBD need to verify the format of this value incase any commas in Holiday Name
                const dateHoliday = new Date(holiday);
                logger.debug(`isHolidayToday,dateToday.toDateString(): ${todaysDate.toDateString()} dateHoliday.toDateString(): ${dateHoliday.toDateString()}`)
                if ( todaysDate.toDateString() === dateHoliday.toDateString()) {
                    isHolidayToday = true;
                    logger.info(`isHolidayToday,isHolidayToday Value: ${isHolidayToday}`)
                }
            }
        })
        callback(null, isHolidayToday)
    } else {
        //TBD Notification to Operations Team
        logger.error(`isHolidayToday,Federal Holidays list is not available in AWS Paramaeter Store for current year: ${currentYear}`)
        callback('No Holidays', isHolidayToday)
    }
}

module.exports = {
    isHolidayToday
};