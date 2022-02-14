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
const { convertPAReqObjToFlatFileRecord } = require('../../sharedLib/common/convert-json-obj-to-flatfile-record')
const { buildInsertQuery } = require('./build-insert-query')

const EventName = 'PROCESS_PA_REQUEST'
const configFolder = process.env.pareqconfigfolder
const paReqBodyObjName = process.env.bodyobj

async function processPAReqSQSMsg (payload, glblUniqId, requiredEnvData, PostgresDBSevice ) {
    const logParams = { globaltransid: glblUniqId };
    const logger = loggerUtils.customLogger(EventName, logParams);
    try {
        const paReqDataObj = payload.pa_req_data
        const paReqFFRecData = await convertPAReqObjToFlatFileRecord(paReqDataObj, glblUniqId, configFolder, paReqBodyObjName )
        logger.info('processPAReqSQSMsg, paReqFFRecData generated Successfully')
        const metaDataObj = payload.metadata
        const addiMetaDataAttribute = requiredEnvData.metadataattribute
        if ( addiMetaDataAttribute !== undefined && addiMetaDataAttribute !== null) {
            const metaDataAttributeObj = addiMetaDataAttribute.split(',')
            metaDataAttributeObj.forEach((element) => {
                logger.info(`processPAReqSQSMsg, metaDataAttributeObj element: ${element}`);
                if ( element === 'flat_fil_rec_obj' ) {
                    metaDataObj.flat_fil_rec_obj = paReqFFRecData
                }
            })
        }
        const insertStatement = await buildInsertQuery(glblUniqId, metaDataObj, requiredEnvData )
        logger.info('processPAReqSQSMsg, Build insert statement Successfully ')
        PostgresDBSevice.insertData(insertStatement, logParams, (err, status) => {
            if ( err ) {
                logger.error(`processPAReqSQSMsg, ERROR in Insert flatfile record : ${err.stack}`);
                throw new Error(`insertData failed: ${err.stack}`)
            } else {
                logger.info(`status: ${status}`);
                return status;
            }
        });
    } catch (err) {
        logger.error(`processPAReqSQSMsg, ERROR: : ${err.stack}` )
    }
}

module.exports = {
    processPAReqSQSMsg,
};