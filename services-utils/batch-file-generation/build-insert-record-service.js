'use strict';
const loggerUtils = require('../../sharedLib/common/logger-utils');

const clsName = 'BuildInsertRecordService'
let instance = null;

class BuildInsertRecordService {

    static getInstance(){
        if(!instance){
            instance = new BuildInsertRecordService();
        }
        return instance;
    }

    async buildInsertRecord (guid, dbInsertData, sysBatchJobData) {
        let logParams = {};
        if (guid) {
            logParams = { globaltransid: guid };
        }
        const logger = loggerUtils.customLogger(clsName, logParams);
        try {
            const insertColObj = dbInsertData.split(',');
            logger.info(`buildInsertRecord,insertColObj: ${insertColObj.length} insertColObj: ${JSON.stringify(insertColObj)}`);
            let insertDbCols = '';
            let insertDbValues = '';
            //providerInfo data Population for insert query
            insertColObj.forEach((element) => {
                logger.debug(`buildInsertRecord,element: ${element}`)
                let dbAttrArray = element.trim().split('^');
                const dbColName = dbAttrArray[0];
                const jsonAtrriName = dbAttrArray[1];
                if ( dbColName !== '' ) {
                    if ( insertDbCols !== '' ) {
                        insertDbCols += ', ';
                    }
                    insertDbCols += dbColName;

                    if ( insertDbValues !== '' ) {
                        insertDbValues += ', ';
                    }
                    logger.debug(`buildInsertRecord,jsonAtrriName: ${jsonAtrriName} : ${sysBatchJobData[jsonAtrriName]}  `);
                    if ( sysBatchJobData[jsonAtrriName] ) {
                        insertDbValues += `'${sysBatchJobData[jsonAtrriName]}'`;
                    } else {
                        if (jsonAtrriName.indexOf('~') > 0 ) {  // This condition is used to add addrInfo data
                            let sysBatchJobAttriInfo = jsonAtrriName.split('~')
                            let formulaValue = sysBatchJobAttriInfo[1];
                            insertDbValues += `${formulaValue}`;
                        } else {
                            insertDbValues += 'null';
                        }
                    }
                }
            })
            const returnData = {
                insertdbcols: insertDbCols,
                insertdbvalues: insertDbValues
            }
            return returnData
            
        } catch(err) {
            logger.error(`buildSysBatchRecord,ERROR: ${err.stack}` )
            throw Error(`buildSysBatchRecord, ERROR in Catch: ${JSON.stringify(err)}`);
        }
    }
}

module.exports = BuildInsertRecordService;