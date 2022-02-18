'use strict'

async function currentTimeInMilliSecs (logger) {
    return new Promise((resolve, reject) => {
        let currentTime = new Date();
        let getCurrentTimeInMilliSecs = currentTime.getTime();
        logger.info(`currentTimeInMilliSecs, date-time-utils getCurrentTimeInMilliSecs: ${getCurrentTimeInMilliSecs}`);
        resolve(getCurrentTimeInMilliSecs)
    }).catch((err) => {
        throw Error(`currentTimeInMilliSecs, failed to convert currentTimeInMilliSecs: ${JSON.stringify(err.stack)}`);
    });
}

async function timeDiffInMilliSecs (logger, endTime, startTime) {
    return new Promise((resolve, reject) => {
        let timeDiffInMilliSecs = endTime - startTime;
        logger.info(`timeDiffInMilliSecs, date-time-utils timeDiffInMilliSecs: ${timeDiffInMilliSecs}`);
        resolve(timeDiffInMilliSecs)
    }).catch((err) => {
        throw Error(`timeDiffInMilliSecs, failed to convert timeDiffInMilliSecs: ${JSON.stringify(err.stack)}`);
    });
}

async function timeDiffInMins (logger, endTime, startTime) {
    return new Promise((resolve, reject) => {
        let timeDiffInMins = endTime - startTime;
        timeDiffInMins = timeDiffInMins / 60000
        logger.info(`timeDiffInMins, date-time-utils timeDiffInMins: ${timeDiffInMins}`);
        resolve(timeDiffInMins)
    }).catch((err) => {
        throw Error(`timeDiffInMins, failed to convert timeDiffInMins: ${JSON.stringify(err.stack)}`);
    });
}

async function formattedDateTime (logger) {
    return new Promise((resolve, reject) => {
        let currentDateTime = new Date();
        let year = currentDateTime.getFullYear()
        let month = currentDateTime.getMonth() + 1
        let day = currentDateTime.getDate()
        let hour = currentDateTime.getHours()
        let min = currentDateTime.getMinutes()
        let sec = currentDateTime.getSeconds()

        month = (month < 10 ? '0' : '') + month;
        day = (day < 10 ? '0' : '') + day;
        hour = (hour < 10 ? '0' : '') + hour;
        min = (min < 10 ? '0' : '') + min;
        sec = (sec < 10 ? '0' : '') + sec;
        
        const formattedDate = year + month + day + hour + min + sec
        logger.debug(`formattedDateTime, formattedDate: ${formattedDate}`);
        resolve(formattedDate)
    }).catch((err) => {
        throw Error(`formattedDateTime, failed to convert the datetime: ${JSON.stringify(err)}`);
    });

}

module.exports = {
    currentTimeInMilliSecs,
    timeDiffInMilliSecs,
    timeDiffInMins,
    formattedDateTime
};