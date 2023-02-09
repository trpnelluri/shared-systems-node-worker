'use strict';

let instance = null;

class EnvForFileNameService {

    static getInstance()
    {
        if(!instance){
            instance = new EnvForFileNameService();
        }
        return instance;
    }

    async envValForFileName (logger) {
        let returnData = 'null';
        const currentEnv = process.env.environment
        
        if ( currentEnv === 'dev') {
            returnData = 'D'
        } else if (currentEnv === 'val') {
            returnData = 'V'
        } else if (currentEnv === 'uat') {
            returnData = 'T'
        } else {
            returnData = 'P'
        }
        logger.info(`envValForFileName, currentEnv: ${currentEnv} returnData: ${returnData}`)
        return returnData
    }
}

module.exports = EnvForFileNameService;