'use strict';

const schedule = require('node-schedule');
const scheduleJobConfig = require('../sharedLib/common/populate-schedule')
const loggerUtils = require('../sharedLib/common/logger-utils');

const runOnWeekEnds = process.env.pa_req_bacth_runon_weekends || 'no^1-5'//yes or no^days to run
const scheduleNightly = process.env.pa_req_bacth_runon_nightly || 'no^6-19'//yes or no^hours to run
const scheduleMinitue = process.env.pa_req_bacth_start_min || '0'// time in mins the Job should trigger
const scheduleSecond = process.env.pa_req_bacth_start_sec || '1'// time in secs the Job should trigger

const EventName = 'SCHEDULER'
const logger = loggerUtils.customLogger( EventName, {});

async function schedule_gen_pa_req_flat_file () {

    logger.info(`schedule_gen_pa_req_flat_file, runOnWeekEnds: ${runOnWeekEnds} scheduleNightly: ${scheduleNightly} scheduleMinitue: ${scheduleMinitue} scheduleSecond${scheduleSecond}`)
    const rule = await scheduleJobConfig.populateSchedule(logger, runOnWeekEnds, scheduleNightly, scheduleMinitue, scheduleSecond )

    const job = schedule.scheduleJob(rule, function(){
        logger.info('The world is going to end today date automate RecurrenceRule.');
        logger.info(`schedule_gen_pa_req_flat_file, job.nextInvocation(): ${JSON.stringify(job.nextInvocation())}`);
    });

}

module.exports = {
    schedule_gen_pa_req_flat_file,
};