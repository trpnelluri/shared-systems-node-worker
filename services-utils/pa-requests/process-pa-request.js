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
const { convertObjDataToFlatFileRecord } = require('../../sharedLib/common/convert-json-obj-to-flatfile-record')
const { buildInsertQuery } = require('./build-insert-query')
const { generateAuditEvent } = require('../../sharedLib/common/generate-auidt-event')

const EventName = 'PROCESS_PA_REQUEST'
const configFolder = process.env.pareqconfigfolder
const paReqBodyObjName = process.env.bodyobj
const SUCCESS = 'Success'
//const FAILURE = 'Failure'

async function processPAReqSQSMsg (payload, glblUniqId, requiredEnvData, PostgresDBSevice ) {
    const logParams = { globaltransid: glblUniqId };
    const logger = loggerUtils.customLogger(EventName, logParams);
    try {
        const paReqDataObj = payload.pa_req_data
        const paReqFFRecData = await convertObjDataToFlatFileRecord(paReqDataObj, glblUniqId, configFolder, paReqBodyObjName )
        logger.info('processPAReqSQSMsg, paReqFFRecData generated Successfully')
        const metaDataObj = payload.metadata
        const addiMetaDataAttribute = requiredEnvData.metadataattribute
        //NOTE: Adding the flat PA request file record to meta data object to insert into the esMD database - Start
        if ( addiMetaDataAttribute !== undefined && addiMetaDataAttribute !== null) {
            const metaDataAttributeObj = addiMetaDataAttribute.split(',')
            metaDataAttributeObj.forEach((element) => {
                logger.info(`processPAReqSQSMsg, metaDataAttributeObj element: ${element}`);
                if ( element === 'flat_fil_rec_obj' ) {
                    metaDataObj.flat_fil_rec_obj = paReqFFRecData
                }
            })
        }
        //NOTE: Adding the flat PA request file record to meta data object to insert into the esMD database - End
        const insertStatement = await buildInsertQuery(glblUniqId, metaDataObj, requiredEnvData )
        logger.info('processPAReqSQSMsg, Build insert statement Successfully ')
        PostgresDBSevice.insertData(insertStatement, logParams, (err, status) => {
            if ( err ) {
                logger.error(`processPAReqSQSMsg, ERROR in Insert flatfile record : ${err.stack}`);
                throw new Error(`insertData failed: ${err.stack}`)
            } else {
                logger.info(`processPAReqSQSMsg, insertData status: ${status}`);
                if ( status === SUCCESS ) {
                    logger.info(`processPAReqSQSMsg, insertData status inside if: ${status}`);

                    let auditEventStatus = generateAuditEvent ( glblUniqId, requiredEnvData )
                    logger.info(`processPAReqSQSMsg, auditEventStatus: ${JSON.stringify(auditEventStatus)}`)

                }
                return status;
            }
        });
    } catch (err) {
        logger.error(`processPAReqSQSMsg, ERROR in catch: ${err.stack}` )
        throw new Error('processPAReqSQSMsg, Completed with errors.');
    }
}

module.exports = {
    processPAReqSQSMsg,
};