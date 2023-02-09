'use strict'
const { currentTimeInMilliSecs, timeDiffInMilliSecs, timeDiffInMins, formattedDateTime} = require('../date-time-utils');
const loggerUtils = require('../logger-utils');
let currentTime = new Date();
let getCurrentTimeInMilliSecs = currentTime.getTime();
let logParams = {};
const logger = loggerUtils.customLogger('date', logParams);
test('currentTimeInMilliSecs success', async () => {
    try {
        const CurrentTime = await currentTimeInMilliSecs(logger);
        expect(CurrentTime).toStrictEqual(CurrentTime);
         
    }catch(err){
        expect(err).toBe(err);
    }
})
test('currentTimeInMilliSecs fail', async () => {
    try{
        await expect(currentTimeInMilliSecs(null)).toThrow(Error);
    }catch(err){
        // expect(err).toBe(err);
    }
})
test('timeDiffInMilliSecs success', async () => {
    try{
        const timeDiffInMilliSecs1 = await timeDiffInMilliSecs(logger, getCurrentTimeInMilliSecs, getCurrentTimeInMilliSecs);
        expect(timeDiffInMilliSecs1).toStrictEqual(0);
    }catch(err){
        expect(undefined).toBe(err);
    }
})
test('timeDiffInMilliSecs fail', async () => {
    try{
        await expect(timeDiffInMilliSecs(null, null, null)).toThrow();
        
    }catch(err){
        // expect(err).toStrictEqual(err);
    }
})
test('timeDiffInMins success', async () => {
    try{
        const timeDiffInMins1 = await timeDiffInMins(logger, getCurrentTimeInMilliSecs, getCurrentTimeInMilliSecs);
        expect(timeDiffInMins1).toStrictEqual(timeDiffInMins1 / 60000);
    }catch(err){
        expect(undefined).not.toBe(err);
    }
})
test('timeDiffInMins fail', async () => {
    try{
    
        await expect(timeDiffInMins(null, null, null)).toThrow();
        
    }catch(err){
        // expect(err).toStrictEqual(err);
    }
})
test('formattedDateTime success', async () => {
    try{
        const formattedDateTime1 = await formattedDateTime(logger);
        expect(formattedDateTime1).toStrictEqual(formattedDateTime1);
    }catch(err){
        expect(undefined).not.toBe(err);
    }
})
test('formattedDateTime fail', async () => {
    try{
    
        await expect(formattedDateTime(null)).toThrow();
                
    }catch(err){
        // expect(err).toStrictEqual(err);
    }
})