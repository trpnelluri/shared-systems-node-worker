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
const {populateDataForBatchFileGeneration} = require('../services-utils/schedule-job/populate-data-for-batch-generation')

const runOnWeekEnds = process.env.ssm_bacth_runon_weekends || 'no^1-5'//yes or no^days to run
const scheduleNightly = process.env.ssm_bacth_runon_nightly || 'no^6-19'//yes or no^hours to run
const scheduleMinitue = process.env.ssm_bacth_start_min || '0'// time in mins the Job should trigger
const scheduleSecond = process.env.ssm_bacth_start_sec || '1'// time in secs the Job should trigger
const scheduleJobName = process.env.esmd_to_dc_schd_job_name

const EventName = 'SCHEDULER_SERVICE'
const logger = loggerUtils.customLogger( EventName, {});
/*
The following method will schedule the schedule job to trigger based on the config values in aws parameter store.
*/
async function createScheJobToGenerateBatchFile () {

    logger.info(`createScheJobToGenerateBatchFile,runOnWeekEnds: ${runOnWeekEnds} scheduleNightly: ${scheduleNightly} scheduleMinitue: ${scheduleMinitue} scheduleSecond: ${scheduleSecond} scheduleJobName: ${scheduleJobName}`)

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
                        logger.error(`createScheJobToGenerateBatchFile,ERROR isHolidayToday: ${err}`)
                    } else {
                        holidayChkRanForToday = true    // This value will take care the Holiday Check will not run every time in a day
                        generateFlatFile = isHolidayToday      // This value will take care 
                        if ( isHolidayToday ) {
                            generateFlatFile = false
                            logger.info(`createScheJobToGenerateBatchFile,job.nextInvocation(): ${JSON.stringify(job.nextInvocation())} isHolidayToday: ${isHolidayToday}`);
                        } else {
                            generateFlatFile = true
                            populateDataForBatchFileGeneration()
                        }
                    }
                })
            } else {
                if ( generateFlatFile ) {
                    logger.info('createScheJobToGenerateBatchFile,Its Not Holiday and Skipping the Holiday Check.');
                    populateDataForBatchFileGeneration()
                }
            }
            const dateToday = new Date();
            const dateJobNextRun = Date.parse(job.nextInvocation());
            const dateHolidayChk = new Date(dateJobNextRun)
            logger.info(`createScheJobToGenerateBatchFile,dateJobNextRun: ${dateJobNextRun} dateHolidayChk: ${dateHolidayChk.toDateString()} dateToday: ${dateToday.toDateString()}`)
            if ( dateToday.toDateString() !== dateHolidayChk.toDateString() ) {
                holidayChkRanForToday = false
                logger.info(`createScheJobToGenerateBatchFile,inside If holidayChkRanForToday: ${holidayChkRanForToday}`)
            }
            logger.info(`createScheJobToGenerateBatchFile,holidayChkRanForToday: ${holidayChkRanForToday}`)
        });
    } catch (err) {
        logger.error(`createScheJobToGenerateBatchFile,ERROR: ${err.stack}`);
        throw new Error('createScheJobToGenerateBatchFile,Completed with errors.');
    }
    
}

module.exports = {
    createScheJobToGenerateBatchFile,
};