'use strict';

const schedule = require('node-schedule');
const scheduleJobConfig = require('../sharedLib/common/populate-schedule')
const loggerUtils = require('../sharedLib/common/logger-utils');

const EventName = 'SCHEDULER'
const logger = loggerUtils.customLogger( EventName, {});

async function schedule_gen_flat_file () {
  
    const rule = await scheduleJobConfig.populateSchedule(logger)

    const job = schedule.scheduleJob(rule, function(){
        logger.info('The world is going to end today date automate RecurrenceRule.');
        logger.info(`job.nextInvocation(): ${JSON.stringify(job.nextInvocation())}`);
    });

    //console.log(`job: ${JSON.stringify(job)}`)
}

module.exports = {
    schedule_gen_flat_file,
};