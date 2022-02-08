'use strict';

const loggerUtils = require('./logger-utils');

const EventName = 'POPULATE_KEYNAME'

async function populateKeyName(glblUniqId, configFolder, ObjName) {
    let logParams = {globaltransid: glblUniqId}
    const logger = loggerUtils.customLogger( EventName, logParams);
    return new Promise((resolve, reject) => {
        logger.debug(`populateKeyName, glblUniqId: ${glblUniqId} configFolder: ${configFolder} ObjName: ${ObjName}` )
        const finalKeyNameInS3 = `${configFolder}${ObjName}`
        logger.info(`populateKeyName, glblUniqId: ${glblUniqId} configFolder: ${configFolder} ObjName: ${ObjName} finalKeyNameInS3: ${finalKeyNameInS3}` )
        resolve(finalKeyNameInS3)
    }).catch((error) => {
        logger.error(`populateKeyName, ERROR: ${error}` )
    });
}

module.exports = {
    populateKeyName,
};