'use strict';
const loggerUtils = require('../../sharedLib/common/logger-utils');
const BuildInsertRecordService = require('./build-insert-record-service')
const PostgresSQLService = require('../../sharedLib/db/postgre-sql-service');

const clsName = 'InsertDataService'
let instance = null;
const sysBatchJobCols = process.env.ssm_sys_batch_job_cols
const sysBatchJobFileDtlCols = process.env.ssm_sys_batch_job_fil_dtl_cols
const refSqlToInsertData = process.env.ref_sql_to_insert_sys_batch_job_rec

class InsertDataService {

    static getInstance(){
        if(!instance){
            instance = new InsertDataService();
        }
        return instance;
    }

    async buildAndInsertSysBatchRec (guid, sysBatchJobData, pool) {
        let logParams = {};
        if (guid) {
            logParams = { globaltransid: guid };
        }
        const logger = loggerUtils.customLogger(clsName, logParams);
        try {
            let insertQry = refSqlToInsertData;
            const sysBatchJobRecRes = await BuildInsertRecordService.getInstance().buildInsertRecord(guid, sysBatchJobCols, sysBatchJobData );
            insertQry = insertQry.replace('$1', sysBatchJobRecRes.insertdbcols);
            insertQry = insertQry.replace('$2', sysBatchJobRecRes.insertdbvalues);
            const sysBatchJobDetailsRecRes = await BuildInsertRecordService.getInstance().buildInsertRecord(guid, sysBatchJobFileDtlCols, sysBatchJobData );
            logger.debug(`buildAndInsertSysBatchRec,sysBatchJobRecRes : ${JSON.stringify(sysBatchJobRecRes)} sysBatchJobDetailsRecRes: ${JSON.stringify(sysBatchJobDetailsRecRes)}`);
            insertQry = insertQry.replace('$3', sysBatchJobDetailsRecRes.insertdbcols );
            insertQry = insertQry.replace('$4', sysBatchJobDetailsRecRes.insertdbvalues);
            logger.info(`buildAndInsertSysBatchRec,insertQry : ${insertQry}`);
            const dbResponse = await PostgresSQLService.getInstance().insertData (insertQry, logParams, pool);
            logger.debug(`buildAndInsertSysBatchRec,dbResponse : ${JSON.stringify(dbResponse)}`);
            return dbResponse;

        } catch(err) {
            logger.error(`buildAndInsertSysBatchRec,ERROR: ${err.stack}` )
            throw Error(`buildAndInsertSysBatchRec, ERROR in Catch: ${JSON.stringify(err)}`);
        }
    }
}

module.exports = InsertDataService;