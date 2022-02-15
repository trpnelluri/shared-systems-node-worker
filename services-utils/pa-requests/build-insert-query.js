/**
 *  This is an esMD sqs consumer serivce to handle the SQS message processing and insert the data into appropriate tables in postgre-sql database.
 *
 * @author Siva Nelluri
 * @date 02/07/2021
 * @version 1.0.0
 *
*/
'use strict'

const loggerUtils = require('../../sharedLib/common/logger-utils');

const EventName = 'BUILD_INSERT_QUERY'

async function buildInsertQuery(glblUniqId, metaDataObj, requiredEnvData ) {
    const logParams = { globaltransid: glblUniqId };
    const logger = loggerUtils.customLogger(EventName, logParams);
    logger.info(`buildInsertQuery, metaDataObj: ${JSON.stringify(metaDataObj)} requiredEnvData: ${JSON.stringify(requiredEnvData)}`)
    return new Promise((resolve, reject) => {
        let values = '';
        let dbAttrArray;
        let dbColumnNames = '';
        const tableName = requiredEnvData.tablename
        const columns = requiredEnvData.columns
        const columnsObj = columns.split(',');
        logger.debug(`buildInsertQuery, columnsObj: ${columnsObj.length}`);
        columnsObj.forEach((element) => {
            const dbAttribute = element.toLowerCase().trim();
            dbAttrArray = dbAttribute.split('^');
            const attributeName = dbAttrArray[0];
            const dbColName = dbAttrArray[1];
            logger.debug(`buildInsertQuery, columnsObj element: ${element} attributeName: ${attributeName} dbColName: ${dbColName}`);
            if (attributeName !== '') { // Column Names from properties files
                if (dbColumnNames !== '') {
                    dbColumnNames += ', ';
                }
                dbColumnNames += dbColName;

                if (values !== '') {
                    values += ', ';
                }
                values += `'${metaDataObj[attributeName]}'`;
            }
        });
        logger.info(`buildInsertQuery, dbColumnNames without ref data: ${dbColumnNames}`);

        const additionalCols = requiredEnvData.additionalcols

        if ( additionalCols !== undefined && additionalCols !== null) {
            const additionalColObj = additionalCols.split(',');
            logger.info(`buildInsertQuery, additionalColObj: ${additionalColObj.length}`);
            additionalColObj.forEach((element) => {
                logger.debug(`buildInsertQuery, additionalColObj element: ${element}`);
                const refDbAttribute = element.trim();
                const refDbAttrArray = refDbAttribute.split('^');

                if (dbColumnNames !== '') {
                    dbColumnNames += ', ';
                }
                dbColumnNames += refDbAttrArray[0];
                if (values !== '') {
                    values += ', ';
                }
                // This Condition is for Formula columns and populate values
                // nextval('esmd_data.seq_actn_audt_log_id')~formula
                if (refDbAttrArray[1].indexOf('~') > -1) {
                    const valuesArry = refDbAttrArray[1].split('~');
                    values += `${valuesArry[0]}`;
                } else {
                    values += `'${refDbAttrArray[1]}'`;
                }
            });
        }

        const insertQuery = `INSERT INTO ${tableName}(${dbColumnNames}) VALUES(${values})`;
        logger.info(`buildInsertQuery, insertQuery: ${insertQuery}`);
        resolve(insertQuery);

    }).catch((error) => {
        logger.error(`buildInsertQuery, ERROR catch: ${error.stack}`);
    });

}

module.exports = {
    buildInsertQuery,
}