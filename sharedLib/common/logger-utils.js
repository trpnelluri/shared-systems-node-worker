'use strict'
const winston = require('winston');
const moment = require('moment');
process.setMaxListeners(0);

const timestampMoment = () => moment().format('YYYY/MM/DD HH:mm:ss SSS');
const workerName = 'ss-node-worker'
const env = process.env.environment
const globaltransid = '-'
const corelationid = '-'

const customLogger = (eventName, logParams) =>{
    //console.log('in logger utils', logFileName)
    return winston.createLogger({
    // error: 0, warn: 1, info: 2, verbose: 3, debug: 4, silly: 5
        level: process.env.loglevel || 'info', // configurable after setting is made at server level
        transports: [
            new winston.transports.Console({
                format: winston.format.combine(
                    winston.format.timestamp({ format: timestampMoment }),
                    winston.format.printf((info) => `${info.timestamp},${info.level.toUpperCase()},${workerName},${env},${eventName},${logParams.globaltransid || globaltransid },${logParams.corelationid || corelationid },${info.message}`),
                ),
            }),
        ],
    })
};

module.exports = {
    customLogger,
}