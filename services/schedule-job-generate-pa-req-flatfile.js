'use strict';

const schedule = require('node-schedule');
//const PopulateData = require('../services-utils/get-flatfile-data')
const scheduleJobConfig = require('../sharedLib/common/populate-schedule')
const checkHolidays = require('../sharedLib/common/holiday-check');
const loggerUtils = require('../sharedLib/common/logger-utils');

const runOnWeekEnds = process.env.pa_req_bacth_runon_weekends || 'no^1-5'//yes or no^days to run
const scheduleNightly = process.env.pa_req_bacth_runon_nightly || 'no^6-19'//yes or no^hours to run
const scheduleMinitue = process.env.pa_req_bacth_start_min || '0'// time in mins the Job should trigger
const scheduleSecond = process.env.pa_req_bacth_start_sec || '1'// time in secs the Job should trigger

const EventName = 'SCHEDULER'
const logger = loggerUtils.customLogger( EventName, {});

async function schedule_gen_pa_req_flat_file () {

    logger.info(`schedule_gen_pa_req_flat_file, runOnWeekEnds: ${runOnWeekEnds} scheduleNightly: ${scheduleNightly} scheduleMinitue: ${scheduleMinitue} scheduleSecond: ${scheduleSecond}`)
    const rule = await scheduleJobConfig.populateSchedule(logger, runOnWeekEnds, scheduleNightly, scheduleMinitue, scheduleSecond )
    
    let holidayChkRanForToday = false
    let generateFlatFile = false

    const job = schedule.scheduleJob(rule, function(){
        if ( !holidayChkRanForToday ) {
            checkHolidays.isHolidayToday(function(err, isHolidayToday) {
                if (err) {
                    logger.error(`schedule_gen_pa_req_flat_file, ERROR: ${err}`)
                } else {
                    holidayChkRanForToday = true    // This value will take care the Holiday Check will not run every time in a day
                    generateFlatFile = isHolidayToday      // This value will take care 
                    if ( isHolidayToday ) {
                        generateFlatFile = false
                        logger.info(`schedule_gen_pa_req_flat_file, job.nextInvocation(): ${JSON.stringify(job.nextInvocation())} isHolidayToday: ${isHolidayToday}`);
                    } else {
                        generateFlatFile = true
                        logger.info('The world is going to end today date automate RecurrenceRule.');
                        logger.info(`schedule_gen_pa_req_flat_file, if job.nextInvocation(): ${JSON.stringify(job.nextInvocation())} isHolidayToday: ${isHolidayToday}`);
                    }
                }
            })
        } else {
            logger.info('Skipping the Holiday Check.');
            if ( generateFlatFile ) {
                logger.info('its Not Holiday.');
            }
        }
        const dateToday = new Date();
        const dateJobNextRun = Date.parse(job.nextInvocation());
        const dateHolidayChk = new Date(dateJobNextRun)
        logger.info(`schedule_gen_pa_req_flat_file, dateJobNextRun: ${dateJobNextRun} dateHolidayChk: ${dateHolidayChk.toDateString()} dateToday: ${dateToday.toDateString()}`)
        if ( dateToday.toDateString() !== dateHolidayChk.toDateString() ) {
            holidayChkRanForToday = false
            logger.info(`schedule_gen_pa_req_flat_file, inside If holidayChkRanForToday: ${holidayChkRanForToday}`)
        }
        logger.info(`schedule_gen_pa_req_flat_file, holidayChkRanForToday: ${holidayChkRanForToday}`)

    });
}

module.exports = {
    schedule_gen_pa_req_flat_file,
};