'use strict'

const awsParamEnv = require('aws-param-env');
const awsParamStore = require('aws-param-store')
const loggerUtils = require('../common/logger-utils');
const commonUtils = require('../common/common-utils');

const environment = process.env.environment || 'dev';
const parameterStore = process.env.PATH_PERAMETER_STORE;
const EventName = 'AWSPARAMETERSTORE'
const configPath = parameterStore + environment + '/auditworker/config/'
const notificationPath = parameterStore + environment + '/auditworker/config_notifications/'

/*
The following function is used to load all the enviornment variables from AWS parameterstore to Config file.
*/
function loadEnvVariablesFromAWSParamStore() {
    try {
        awsParamEnv.load(`${configPath}`, { region: 'us-east-1' });
        let nodeApplogFileNameFromEnv = process.env.node_app_logfileName;
        const nodeApplogFileName = commonUtils.verifyLastCharInString(nodeApplogFileNameFromEnv, EventName, '-')
        let logParams = {};
        const logger = loggerUtils.customLogger(nodeApplogFileName, EventName, logParams);
        logger.info('Env variables loaded successfully from AWS Parameter Store.');
        logger.clear();
    } catch (err) {
        console.error('ERROR loading the env variables from AWS Parameter Store.' + err.stack)
    }
}

function getParameterFromStore(param, logger){
    logger.debug(`getParameterFromStore param: ${param}`);
    let returnData = awsParamStore.getParameterSync( notificationPath + param, { region: process.env.AWS_REGION || 'us-east-1' } )
    logger.info(`getParameterFromStore returnData : ${JSON.stringify(returnData)}`);
    return returnData;
}

module.exports = {
    loadEnvVariablesFromAWSParamStore,
    getParameterFromStore,
};