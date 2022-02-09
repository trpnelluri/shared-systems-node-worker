'use strict'

const express = require('express');
// eslint-disable-next-line no-unused-vars
const config = require('dotenv').config({ path: './config/.env' });
const ParameterStoreData = require('./sharedLib/aws/parameter-store-service');
ParameterStoreData.loadEnvVariablesFromAWSParamStore();
const loggerUtils = require('./sharedLib/common/logger-utils');
const scheduleGenerateFlatfileJob = require('./services/schedule-job-generate-pa-req-flatfile')
const SS_PA_RER_SQS_Service = require('./services/pa-req-sqs-consumer')

const EventName = 'SS_WORKER_APP';
let logParams = {};
const logger = loggerUtils.customLogger( EventName, logParams);
const app = express();
app.use('/', require('./routes/route'));
const port = process.env.port || 8092;
app.listen(port, () => {
    logger.info(`app.listen, listining on port: ${port}`);
    // The following function invoke the sqs message consumer service when ever the application starts.
    scheduleGenerateFlatfileJob.schedule_gen_pa_req_flat_file();
    logger.info('app.listen, schedule_gen_pa_req_flat_file Job Started');
    SS_PA_RER_SQS_Service.ss_pa_req_sqs_service()
    logger.info('app.listen, SS_PA_RER_SQS_Service Consumer Started');
});