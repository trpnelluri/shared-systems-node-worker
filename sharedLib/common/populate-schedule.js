'use strict'
/**
 *  This is an esMD service to populate schedule based on the config values in aws parameter store.
 * 
 *  @author Siva Nelluri
 *	@date 01/25/2021
 *	@version 1.0.0
 * 
*/

const schedule = require('node-schedule');

/*
NOTE: scheduleJob Propety is '* * * * * *'
Explanation: 
    1st star: seconds(Optional)
    2nd star: minute
    3rd star: hour
    4th star: day of month
    5th star: month
    6th star: day of week (0 is Sunday and 6 is Saturday)
    if you need more info please refer node-schedule npm
*/

/*
NOTE: The following function is used to build the schedule job based on the values provided 
    in parameter store configuration.
*/
async function populateSchedule ( logger, scheduleInfo ){
    return new Promise((resolve, reject) => {
        const rule = new schedule.RecurrenceRule();
        const runOnWeekEnds = scheduleInfo.runonweekends
        const scheduleNightly = scheduleInfo.schedulenightly
        let scheduleMinitue = scheduleInfo.scheduleminitue
        if ( scheduleMinitue === 'null' ) {
            scheduleMinitue = null
        }
        const scheduleSecond = scheduleInfo.schedulesecond
        //Schedule to run on only Weekdays 
        if ( runOnWeekEnds !== undefined ) {
            let arrRunOnWeekEnds = runOnWeekEnds.split('^')
            let paramRunOnWeekEnds = arrRunOnWeekEnds[0].toLowerCase()
            let runOnWeekDays = arrRunOnWeekEnds[1]
            if ( paramRunOnWeekEnds === 'no') {
                if ( runOnWeekDays !== '' && runOnWeekDays !== undefined ) {
                    let arrDaysToRun = runOnWeekDays.split('-')
                    rule.dayOfWeek = new schedule.Range(arrDaysToRun[0], arrDaysToRun[1])
                } else {
                    rule.dayOfWeek = new schedule.Range(1, 5) //This will be the default value if we don't provide in Parameter Store
                }
            }
        }
        //Schedule to run on only business hours 
        if ( scheduleNightly !== undefined ) {
            let arrScheNightly = scheduleNightly.split('^')
            let paramScheNightly = arrScheNightly[0].toLowerCase()
            let hoursToRun = arrScheNightly[1]
            if ( paramScheNightly === 'no') {
                rule.hour = new schedule.Range(6, 19)
                if ( hoursToRun !== '' && hoursToRun !== undefined ) {
                    let arrHoursToRun = hoursToRun.split('-')
                    rule.hour = new schedule.Range(arrHoursToRun[0], arrHoursToRun[1])
                } else {
                    rule.hour = new schedule.Range(6, 19) //This will be the default value if we don't provide in Parameter Store
                }
            }
        }
        // The follwoing values are to triggier the job hourly in 1st second.
        rule.minute = scheduleMinitue // 0
        rule.second = scheduleSecond // 1
        logger.info(`populateSchedule,rule: ${JSON.stringify(rule)}`)
        resolve(rule)

    }).catch((err) => {
        logger.error(`populateSchedule,ERROR: ${err.stack}`);
    });
}

module.exports = {
    populateSchedule,
}