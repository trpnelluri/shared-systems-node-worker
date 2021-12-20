'use strict'

const loggerUtils = require('../common/logger-utils');

let environment = process.env.environment || 'dev';

// The following line added for UNIT TEST Scripts
if ( environment !== 'dev' || environment !== 'val' || environment !== 'uat' || environment !== 'prod' ) {
    environment = 'dev'
}

/*
The following function will verify the last letter in the string from parameter store value and if the 
required letter/char is not available it will add the required letter at the end of the value. 
*/
function verifyLastCharInString (logFileName, EventName, charToVerify) {
    try {
        let lastCharOfLogFileName = logFileName.slice(-1);
        if (lastCharOfLogFileName !== charToVerify ){
            logFileName += charToVerify;
        }
        logFileName += environment + charToVerify;
        let logParams = {};
        const logger = loggerUtils.customLogger(logFileName, EventName, logParams);
        logger.info(`verifyLastCharInEnvVariable envVarName: ${logFileName}`);
        logger.clear();
        return logFileName;
    } catch(err) {
        console.log(`Error in verifyLastCharInEnvVariable function: ${err.stack}`)
        throw new Error('verifyLastCharInEnvVariable completed with errors.');
    }
}

module.exports = {
    verifyLastCharInString,
}