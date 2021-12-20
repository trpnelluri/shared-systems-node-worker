'use strict'

/**
 *  This is postgreSQL connection service to insert the data into appropriate tables in postgre-sql database.
 * 
 *  @author Siva Nelluri
 *	@date 09/20/2021
 *	@version 1.0.0
 * 
*/

const { Pool } = require('pg');
const getDBConnInfo = require('../aws/db-conn-details-from-ssm');
const loggerUtils = require('../common/logger-utils');
const commonUtils = require('../common/common-utils')

let pool;
let count = 0;
let logFileNameFromEnv = process.env.pgs_log_filename;
const EventName = 'POSTGRESDBSERVICE'
const pgsLogFileName = commonUtils.verifyLastCharInString(logFileNameFromEnv, EventName, '-')

/*
The following function is used to establish the connection to the postgreSQL database from Audit worker and the connection details will
from AWS Secrect Manager serveice.
*/
const connectToPostgresDB = () => {

    let logParams = {};
    const logger = loggerUtils.customLogger(pgsLogFileName, EventName, logParams);
    logger.info(`connectToPostgresDB process.env.SM_PGS_DB_AUTH: ${process.env.SM_PGS_DB_AUTH}`)
        
    try{
        const params = {
            SecretId: process.env.SM_PGS_DB_AUTH,
        };
        getDBConnInfo.getDBConnDetails(params, logger, (err, dbConnDetails) => {
            if (err) {
                logger.error(`Error whcile getting the DB connection info from secret manager service: ${err.stack}`);
            } else {
                dbConnDetails = JSON.parse(dbConnDetails);
                const idleTimeout = process.env.pgs_idle_time_out;
                const connTimeout = process.env.pgs_conn_time_out;
                logger.info(`idleTimeout: ${idleTimeout} connTimeout: ${connTimeout}`);
    
                pool = new Pool({
                    user: dbConnDetails.username,
                    host: dbConnDetails.host,
                    database: dbConnDetails.dbname,
                    password: dbConnDetails.password,
                    port: dbConnDetails.port,
                    idleTimeoutMillis: idleTimeout, // 30 sec
                    connectionTimeoutMillis: connTimeout, // 5 sec
                    max: 20,
                });
            }
    
            pool.on('connect', (client) => {
                logger.debug('connect');
            });
    
            pool.on('acquire', (client) => {
                count += 1;
                logger.debug(`acquire count : ${count}`);
            });
    
            pool.on('error', (error) => {
                logger.error(`connection Error: ${error}`);
                logger.clear();
            });

        });

    } catch(err) {
        logger.error(`connectToPostgresDB error getting ref data: ${err.stack}`);
        logger.clear();
    }
    
}

/*
The follwoing function is used to get the reference data from esmd_data.audt_evnt_actn_rfrnc table to based on audt_evnt_actn_name
*/
const getRequiredRefData = async function (text, valsToReplace, logParams, callback, poolData = undefined) {
    const logger = loggerUtils.customLogger(pgsLogFileName, EventName, logParams);
    logger.info(`getRequiredRefData query to execute: ${text} valuesToReplace: ${valsToReplace}`);
    try {

        //const currentPool = pool || poolData;
        //const client = await pool.connect();
        const client = await pool.connect();
        const newClient = poolData || client ;
        
        //currentPool.query(text, valsToReplace, (err, res) => {
        newClient.query(text, valsToReplace, (err, res) => {
            if (err) {
                logger.error(`getRequiredRefData error getting ref data: ${err.stack}`);
                logger.clear();
                callback(err, 0);
            } else {
                logger.info(`res result to send: ${JSON.stringify(res.rows[0])} res.rowCount: ${res.rowCount}`);
                client.release();
                //currentPool.release();
                count -= 1;
                logger.debug(`count release: ${count}`);
                logger.clear();
                callback(null, res.rows[0]);
            }
        });

    } catch(err) {
        logger.error(`getRequiredRefData catch block error: ${err.stack}`);
        logger.clear();
        callback(err, 0);
    }
};

/*
The follwoing function is used to insert the Audit trans data into esmd_data.submsn_trans_actn_audt_log table
*/
const insertData = async function (text, logParams, callback, poolData) {
    const logger = loggerUtils.customLogger(pgsLogFileName, EventName, logParams);
    logger.info(`insert Data query to execute: ${text} `);
    try {
        //const currentPool = pool || poolData;
        //const client = await currentPool.connect();
        const client = await pool.connect();
        const newClient = poolData || client ;

        newClient.query(text, (err, res) => {
        //currentPool.query(text, (err, res) => {
            if (err) {
                logger.error(`insert Data error getting ref data: ${err.stack}`);
                logger.clear();
                callback(err, 'FAILURE');
            } else {
                logger.info(`insert Data inserted rows count: ${res.rowCount}`);
                client.release();
                //currentPool.release();
                count -= 1;
                logger.debug(`count release: ${count}`);
                logger.clear();
                if (res.rowCount > 0) {
                    callback(null, 'SUCCESS');
                } else {
                    callback(null, 'FAILURE');
                }
            }
        });
    }catch(err) {
        logger.error(`insert Data catch block error: ${err.stack}`);
        logger.clear();
        callback(err, 'FAILURE');
    }
   
};


module.exports = {
    connectToPostgresDB,
    getRequiredRefData,
    insertData,
}
