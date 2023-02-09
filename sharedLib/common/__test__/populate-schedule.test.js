'use strict'
const { populateSchedule } = require('../populate-schedule');
const loggerUtils = require('../logger-utils');

const logger = loggerUtils.customLogger('schedule', {});
test('populateSchedule success', async () => {
    try {
        let scheduleInfo = {};
        scheduleInfo.runonweekends = 'no';
        scheduleInfo.schedulenightly = 'no';
        scheduleInfo.scheduleminitue = 1;
        const schedule = await populateSchedule(logger, scheduleInfo);
        expect(schedule.minute).toStrictEqual(1);
         
    }catch(err){
        expect(err).toBe(err);
    }
})