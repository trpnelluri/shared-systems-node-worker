'use strict';
const lodash = require('lodash');
const loggerUtils = require('../../sharedLib/common/logger-utils');
const SQSServiceShared = require('../../sharedLib/aws/sqs-service');
const PostgresPoolService = require('../../sharedLib/db/postgre-pool-service');
const PostgresSQLService = require('../../sharedLib/db/postgre-sql-service');

const EventName = 'POPULATE_DATA_FOR_BATCHFILE'
const targetQueueQRL = process.env.ss_req_gen_flatfile_sqs_url;
//const dcfInterFaceID = process.env.ref_sql_replace_dcf_interface_id;

async function populateDataForBatchFileGeneration () {
    let logParams = {};
    const logger = loggerUtils.customLogger(EventName, logParams);
    try{
        const pool = await PostgresPoolService.getInstance().connectToPostgresDB();
        const dateToday = new Date();
        let hours = dateToday.getHours();
        logger.info (`getRequiredDataForBatchfile,hours: ${hours}`)
        if (hours < 10) {
            hours = '0' + hours;
        }
        let refSqlToGenerateBatchFile = process.env.ref_sql_to_gen_batch_files_as_per_schedule
        refSqlToGenerateBatchFile = refSqlToGenerateBatchFile.replace('$1', 'HH24');
        refSqlToGenerateBatchFile = refSqlToGenerateBatchFile.replace('$2', 'HH24');
        refSqlToGenerateBatchFile = refSqlToGenerateBatchFile.replace('$3', '14');  //SRVC='14', DCF='18', PAReq='11', hours

        const response = await PostgresSQLService.getInstance().excSelectQuery(refSqlToGenerateBatchFile, logParams, pool);
        if ( !(lodash.isEmpty(response))) {
            logger.info(`populateDataForBatchFileGeneration,responselength: ${response.length}`);
            const sendMsgRes = await SQSServiceShared.getInstance().sendMessage(response, targetQueueQRL, logParams);
            logger.info(`populateDataForBatchFileGeneration,sednMesageStatus: ${JSON.stringify(sendMsgRes)}`);
        } else {
            logger.info('populateDataForBatchFileGeneration,Data not available to generate flatfile at this time');
        }
    } catch(err) {
        logger.error(`populateDataForBatchFileGeneration,ERROR in catch: ${err.stack}`);
    }
}
module.exports = {
    populateDataForBatchFileGeneration,
}