'use strict'

/**
 *  This is an esMD postgreSQL connection service to insert the data into appropriate tables in postgre-sql database.
 * 
 *  @author Siva Nelluri
 *	@date 02/08/2021
 *	@version 1.0.0
 * 
*/

const { Pool } = require('pg');
const { getDBConnDetails } = require('../aws/db-conn-details-from-ssm');
const loggerUtils = require('../common/logger-utils');

let pool;
let count = 0;
const EventName = 'POSTGRES_DB_SERVICE'

/*
The following function is used to establish the connection to the postgreSQL database from Audit worker and the connection details will
from AWS Secrect Manager serveice.
*/
const connectToPostgresDB = () => {
    let logParams = {};
    const logger = loggerUtils.customLogger(EventName, logParams);
    logger.info(`connectToPostgresDB, process.env.SM_PGS_DB_AUTH: ${process.env.SM_PGS_DB_AUTH}`)
        
    try{
        const params = {
            SecretId: process.env.SM_PGS_DB_AUTH,
        };
        getDBConnDetails(params, logger, (err, dbConnDetails) => {
            if (err) {
                logger.error(`connectToPostgresDB, Error while getting the getDBConnDetails from secret manager service: ${err.stack}`);
            } else {
                dbConnDetails = JSON.parse(dbConnDetails);
                const idleTimeout = process.env.pgs_idle_time_out;
                const connTimeout = process.env.pgs_conn_time_out;
                logger.info(`connectToPostgresDB, idleTimeout: ${idleTimeout} connTimeout: ${connTimeout}`);
    
                pool = new Pool({
                    user: dbConnDetails.username,
                    //host: dbConnDetails.host,
                    host:'localhost',
                    database: dbConnDetails.dbname,
                    password: dbConnDetails.password,
                    port: dbConnDetails.port,
                    idleTimeoutMillis: idleTimeout, // 30 sec
                    connectionTimeoutMillis: connTimeout, // 5 sec
                    max: 20,
                });
            }
    
            pool.on('connect', (client) => {
                logger.debug('connectToPostgresDB, connect');
            });
    
            pool.on('acquire', (client) => {
                count += 1;
                logger.debug(`connectToPostgresDB, acquire count : ${count}`);
            });
    
            pool.on('error', (error) => {
                logger.error(`connectToPostgresDB, connection Error: ${error}`);
            });

        });

    } catch(err) {
        logger.error(`connectToPostgresDB, ERROR: ${err.stack}`);
    }
}

/*
The follwoing function is used to insert the data into esMD dataabse in any table mentioned in the AWS parameter store.
Ex: esmd_data.ptnt_pa_rqst_to_data_cntr
*/
const insertData = async function (text, logParams, callback, poolData) {
    const logger = loggerUtils.customLogger(EventName, logParams);
    logger.info(`insertData, Data query to execute: ${text} `);
    try {
        const client = await pool.connect();
        const newClient = poolData || client ;

        newClient.query(text, (err, res) => {
            if (err) {
                logger.error(`insertData, ERROR while insert: ${err.stack}`);
                callback(err, 'FAILURE');
            } else {
                logger.info(`insertData, Inserted rows count: ${res.rowCount}`);
                client.release();
                count -= 1;
                logger.debug(`insertData, count release: ${count}`);
                if (res.rowCount > 0) {
                    callback(null, 'SUCCESS');
                } else {
                    callback(null, 'FAILURE');
                }
            }
        });
    }catch(err) {
        logger.error(`insertData, ERROR in catch block: ${err.stack}`);
        callback(err, 'FAILURE');
    }
};


module.exports = {
    connectToPostgresDB,
    insertData,
}
