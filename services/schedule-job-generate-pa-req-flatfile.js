'use strict';

/**
 *  This is an esMD sschdule job serivce to run on hourly basis and generate required data to send the 
 *      flatfiles from esMD to Data Center.
 * 
 *  @author Siva Nelluri
 *	@date 01/24/2021
 *	@version 1.0.0
 * 
*/

const schedule = require('node-schedule');
const scheduleJobConfig = require('../sharedLib/common/populate-schedule')
const checkHolidays = require('../sharedLib/common/holiday-check');
const loggerUtils = require('../sharedLib/common/logger-utils');
const {populateDataForBatchFileGeneration} = require('./populate-data-for-batch-generation')

const runOnWeekEnds = process.env.pa_req_bacth_runon_weekends || 'no^1-5'//yes or no^days to run
const scheduleNightly = process.env.pa_req_bacth_runon_nightly || 'no^6-19'//yes or no^hours to run
const scheduleMinitue = process.env.pa_req_bacth_start_min || '0'// time in mins the Job should trigger
const scheduleSecond = process.env.pa_req_bacth_start_sec || '1'// time in secs the Job should trigger
const scheduleJobName = process.env.esmd_to_dc_schd_job_name

const EventName = 'SCHEDULER'
const logger = loggerUtils.customLogger( EventName, {});
/*
The following method will schedule the schedule job to trigger based on the config values in aws parameter store.
*/
async function schedule_gen_pa_req_flat_file () {

    logger.info(`schedule_gen_pa_req_flat_file, runOnWeekEnds: ${runOnWeekEnds} scheduleNightly: ${scheduleNightly} scheduleMinitue: ${scheduleMinitue} scheduleSecond: ${scheduleSecond}`)

    try {
        const scheduleInfo = {
            runonweekends: runOnWeekEnds,
            schedulenightly: scheduleNightly,
            scheduleminitue: scheduleMinitue,
            schedulesecond: scheduleSecond
        }
        const rule = await scheduleJobConfig.populateSchedule(logger, scheduleInfo )
        let holidayChkRanForToday = false
        let generateFlatFile = false
        const job = schedule.scheduleJob(scheduleJobName, rule, function(){
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
                            //TBD Implement the process to generate the flat files.
                            populateDataForBatchFileGeneration()
                            logger.info('The world is going to end today date automate RecurrenceRule.');
                            logger.info(`schedule_gen_pa_req_flat_file, if job.nextInvocation(): ${JSON.stringify(job.nextInvocation())} isHolidayToday: ${isHolidayToday}`);
                        }
                    }
                })
            } else {
                logger.info('Skipping the Holiday Check.');
                if ( generateFlatFile ) {
                //TBD Implement the process to generate the flat files.
                    populateDataForBatchFileGeneration()
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
    } catch (err) {
        logger.error(`schedule_gen_pa_req_flat_file, ERROR: ${err.stack}`);
    }
    
}

module.exports = {
    schedule_gen_pa_req_flat_file,
};