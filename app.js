'use strict'

const express = require('express');
// eslint-disable-next-line no-unused-vars
const config = require('dotenv').config({ path: './config/.env' });
const ParameterStoreData = require('./sharedLib/aws/parameter-store-service');
ParameterStoreData.loadEnvVariablesFromAWSParamStore();
const loggerUtils = require('./sharedLib/common/logger-utils');
const CreateScheduleJobService = require('./services/create-schedule-job-to-gen-pa-req-batchfile')
const ProcessPAReqService = require('./services/process-pa-req-sqs-consumer')
const CreateBatchFileService = require('./services/generate-pa-req-batch-file-sqs-consumer')
const PostgresDBSevice = require('./sharedLib/db/postgre-sql-pool');
PostgresDBSevice.connectToPostgresDB()
const EventName = 'SS_WORKER_APP';
let logParams = {};
const logger = loggerUtils.customLogger( EventName, logParams);
const app = express();
app.use('/', require('./routes/route'));
const port = process.env.port || 8092;
const releaseVersion = process.env.releaseversion
app.listen(port, () => {
    logger.info(`app.listen, listining on port: ${port} Release Version: ${releaseVersion}`);
    // The following function triggers the schedule job to run the batch job whenever the application starts.
    CreateScheduleJobService.createScheJobToGenPAReqBatchFile(PostgresDBSevice);
    logger.info('app.listen, CreateScheduleJobService Job Started');
    // The following function invoke the sqs message consumer service whenever the application starts.
    ProcessPAReqService.processPARequestService(PostgresDBSevice)
    logger.info('app.listen, paRequestProcessService Started');

    CreateBatchFileService.genPAReqBatchFileService(PostgresDBSevice)
    logger.info('app.listen, genPAReqBatchFileService Started');
});