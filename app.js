'use strict'

const express = require('express');
// eslint-disable-next-line no-unused-vars
const config = require('dotenv').config({ path: './config/.env' });
const ParameterStoreData = require('./sharedLib/aws/parameter-store-service');
ParameterStoreData.loadEnvVariablesFromAWSParamStore();
const loggerUtils = require('./sharedLib/common/logger-utils');
const scheduleGenerateFlatfileJob = require('./services/schedule-generate-pa-req-flatfile-job')

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
    logger.info('app.listen, scheduleProcessHIHDlq Job Started');
});