/**
 *  This is an esMD sqs consumer serivce to handle the SQS message processing and insert the data into appropriate tables in postgre-sql database.
 *
 * @author Siva Nelluri
 * @date 02/07/2021
 * @version 1.0.0
 *
*/
'use strict'

//const PostgresDBSevice = require('../../sharedLib/db/postgre-sql-pool');
const loggerUtils = require('../../sharedLib/common/logger-utils');
const { convertPAReqObjToFlatFileRecord } = require('../../sharedLib/common/convert-json-obj-to-flatfile-record')
const { buildInsertQuery } = require('./build-insert-query')
const EventName = 'PROCESS_PA_REQUEST'
const configFolder = process.env.pareqconfigfolder
const paReqBodyObjName = process.env.bodyobj

async function processPAReqSQSMsg (payload, glblUniqId, requiredEnvData ) {
    const logParams = { globaltransid: glblUniqId };
    const logger = loggerUtils.customLogger(EventName, logParams);
    try {
        const paReqDataObj = payload.pa_req_data
        const paReqFFRecData = await convertPAReqObjToFlatFileRecord(paReqDataObj, glblUniqId, configFolder, paReqBodyObjName )
        logger.info(`processPAReqSQSMsg, paReqFFRecData: ${paReqFFRecData}`)
        const metaDataObj = payload.metadata
        const addiMetaDataAttribute = requiredEnvData.metadataattribute
        if ( addiMetaDataAttribute !== undefined && addiMetaDataAttribute !== null) {
            const metaDataAttributeObj = addiMetaDataAttribute.split(',')
            metaDataAttributeObj.forEach((element) => {
                logger.debug(`processPAReqSQSMsg, metaDataAttributeObj element: ${element}`);
                if ( element === 'flat_fil_rec_obj' ) {
                    metaDataObj.flat_fil_rec_obj = paReqFFRecData
                }
            })
        }
        const insertStatement = await buildInsertQuery(glblUniqId, metaDataObj, requiredEnvData )
        logger.info(`processPAReqSQSMsg, insertStatement: ${insertStatement}`)
    } catch (err) {
        logger.error(`processPAReqSQSMsg, ERROR: : ${err.stack}` )
    }
}

module.exports = {
    processPAReqSQSMsg,
};