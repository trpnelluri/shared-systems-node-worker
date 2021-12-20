'use strict'
const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');
const moment = require('moment');
process.setMaxListeners(0);

const timestampMoment = () => moment().format('YYYY/MM/DD HH:mm:ss SSS');

const customLogger = (logFileName, eventName, logParams) =>{
    //console.log('in logger utils', logFileName)
    return winston.createLogger({
    // error: 0, warn: 1, info: 2, verbose: 3, debug: 4, silly: 5
        level: process.env.logLevel || 'info', // configurable after setting is made at server level
        transports: [
            new winston.transports.Console({
                format: winston.format.combine(
                    winston.format.timestamp({ format: timestampMoment }),
                    winston.format.printf((info) => `${info.timestamp} ${info.level.toUpperCase()}: ${info.message ? info.message : ''}`),
                //winston.format.printf((info) => `${info.timestamp},${info.level.toUpperCase()},${logParams.globaltransid || '-' },${eventName},-, ${info.message}`),
                ),
            }),
            //new winston.transports.DailyRotateFile({
            new DailyRotateFile({
                filename: `${logFileName}%DATE%.log`,
                json: false,
                timestamp: timestampMoment,
                datePattern: 'YYYY-MM-DD',
                format: winston.format.combine(
                    winston.format.timestamp({ format: timestampMoment }),
                    winston.format.printf((info) => `${info.timestamp},${info.level.toUpperCase()},${logParams.globaltransid || '-' },${eventName},-, ${info.message}`),
                ),
                handleExceptions: true,
                humanReadableUnhandledException: true,
                prettyPrint: true,
                localTime: true,
            }),
        ],
    })
};

module.exports = {
    customLogger,
}