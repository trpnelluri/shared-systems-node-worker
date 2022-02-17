'use strict'

const loggerUtils = require('../sharedLib/common/logger-utils');
const PostgresDBSevice = require('../sharedLib/db/postgre-sql-pool');
PostgresDBSevice.connectToPostgresDB()

const generateFlatFile = require('../services-utils/batch-file-generation/process-batch-file-message');
const { msgDataObj } = require('../sharedLib/common/sample-json-file');

const EventName = 'CONTROLLER'

const logger = loggerUtils.customLogger( EventName, {});

exports.default = async(req, res) => {
    logger.info(`default, req.headers: ${JSON.stringify(req.headers)}`)
    res.send('Welcome to Unissant');
};

exports.holidaysList = async(req, res) => {
    logger.info(`default, req.headers: ${JSON.stringify(req.headers)}`)
    //let isHoliday = await holidaysData.isHolidayToday()
    //logger.info(`isHoliday : ${isHoliday}`)
    const today = new Date();
    console.log(`todaysDate: ${today}`)
    const tomorrow = new Date();
    // Add 1 Day
    tomorrow.setDate(today.getDate() + 1);
    console.log(`tomorrow Date: ${tomorrow}`)
};


exports.generateBatchFile = async(req, res) => {
    logger.info(`default, req.headers: ${JSON.stringify(req.headers)}`)
    const requiredEnvData = {
        tablename: process.env.pareqtodcdatatable,
        colstouseinrefsql: process.env.db_cols_to_get_data_for_batch,
        refsql: process.env.ref_sql_to_get_data_for_batch,
        refsqlreplacevals: process.env.ref_sql_replace_attributes,
        batchfileforsrvcregid: process.env.batch_file_for_srvcreg_id,
        batchfilefordcfid: process.env.batch_file_for_dcf_id
    }
    let response = await generateFlatFile.processBatchFileSQSMessage (msgDataObj, requiredEnvData, PostgresDBSevice)
    console.log(`response: ${JSON.stringify(response)}`)
    res.send('Welcome to Unissant232');
};