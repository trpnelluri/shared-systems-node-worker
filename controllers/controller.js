'use strict'

const loggerUtils = require('../sharedLib/common/logger-utils');
//const holidaysData = require('../sharedLib/common/holiday-check');

const EventName = 'CONTROLLER'

const logger = loggerUtils.customLogger( EventName, {});

exports.default = async(req, res) => {
    logger.info(`default, req.headers: ${JSON.stringify(req.headers)}`)
    res.send('Welcome to Unissant');
};

exports.holidaysList = async(req, res) => {
    logger.info(`default, req.headers: ${JSON.stringify(req.headers)}`)
    //let isHoliday = await holidaysData.isHolidayToday()
    //logger.info(`isHoliday : ${isHoliday}`)

    
    const today = new Date();
    console.log(`todaysDate: ${today}`)
    const tomorrow = new Date();
    
    // Add 1 Day
    tomorrow.setDate(today.getDate() + 1);
    console.log(`tomorrow Date: ${tomorrow}`)

    // let my_job = schedule.scheduledJobs[scheduleJobName]
    // my_job.cancel();
    // logger.info(`schedule_gen_pa_req_flat_file, cancelled the schedule job: ${scheduleJobName}`)
        
    res.send('Welcome to Unissant232');
};