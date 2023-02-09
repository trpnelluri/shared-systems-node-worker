'use strict'

/**
 *  This is an esMD postgreSQL connection service to insert the data into appropriate tables in postgre-sql database.
 * 
 *  @author Siva Nelluri
 *	@date 02/08/2021
 *	@version 1.0.0
 * 
*/
const loggerUtils = require('../common/logger-utils');

const EventName = 'PostgresSQLService'
const SUCCESS = 'Success'
const FAILURE = 'Failure'

let instance = null;

class PostgresSQLService {
    
    static getInstance() {
        if (!instance) {
            instance = new PostgresSQLService();
        }
        return instance;
    }

    async excSelectQuery (queryToExecute, logParams, pool) {
        const logger = loggerUtils.customLogger( EventName, logParams);
        const client = await pool.connect();
        try {
            logger.info(`excSelectQuery,pool connected successfully.queryToExecute: ${queryToExecute}`);
            let response = await client.query(queryToExecute);
            client.release();
            if ( response.rowCount > 0 ) {
                return response.rows        //Returning data rows
            } else {
                return null
            }
        } catch (err) {
            logger.error(`excSelectQuery,ERROR in catch ${err.stack}`)
            client.release();
        }
    }

    async insertData (queryToExecute, logParams, pool) {
   
        const logger = loggerUtils.customLogger( EventName, logParams);
        logger.info(`asyncInsertData,insert Data query to execute: ${queryToExecute} `);
        const client = await pool.connect();
        try {
            let response = await client.query(queryToExecute);
            client.release();
            logger.info(`asyncInsertData,insert Data inserted rows count: ${response.rowCount}`);
            if (response.rowCount > 0) {
                return SUCCESS
            } else {
                return FAILURE
            }
        } catch(err) {
            client.release();
            logger.info(`asyncInsertData,catch block error: ${err.stack}`);
        }
    }

    async excUpdateQuery (queryToExecute, logParams, pool) {
        const logger = loggerUtils.customLogger( EventName, logParams);
        const client = await pool.connect();
        try {
            logger.info(`excUpdateQuery,pool connected successfully. queryToExecute: ${queryToExecute}`);
            let response = await client.query(queryToExecute);
            client.release();
            if ( response.rowCount > 0 ) {
                return response.rowCount   //Returning row count
            } else {
                return null
            }
        } catch (err) {
            logger.error(`excUpdateQuery,ERROR in catch ${err.stack}`)
            client.release();
        }
    }

    async getNewGUID (queryToGenGUID, logParams, pool) {
        const logger = loggerUtils.customLogger( EventName, logParams);
        const client = await pool.connect();
        try {
            logger.info(`getNewGUID,pool connected successfully queryToGenGUID: ${queryToGenGUID}`);
            let response = await client.query(queryToGenGUID);
            client.release();
            let TransID = 'null'
            if ( response.rowCount > 0 ) {
                TransID = response.rows[0].generate_global_unique_id
            }
            return TransID;
        } catch (err) {
            console.log(`getNewGUID,ERROR in catch ${err.stack}`)
            client.release();
        }
    }

}

module.exports = PostgresSQLService;

/*
The follwoing function is used to get the reference data from esmd_data.audt_evnt_actn_rfrnc table to based on audt_evnt_actn_name
*/

/*
const getRequiredRefData = async function (query, valsToReplace, logParams, pool, callback) {
    const logger = loggerUtils.customLogger( EventName, logParams);
    logger.info(`getRequiredRefData,Query to execute: ${query} valuesToReplace: ${valsToReplace}`);
    const client = await pool.connect();
    try {
        let rowsFound = false;
        client.query(query, valsToReplace, (err, res) => {
            if (err) {
                logger.error(`getRequiredRefData,Error getting ref data: ${err.stack}`);
                client.release();
                callback(err, 0);
            } else {
                logger.info(`getRequiredRefData,res.rowCount: ${res.rowCount}`);
                client.release();
                if ( res.rowCount > 0 ) {
                    rowsFound = true
                }
                callback(null, rowsFound, res.rows)
            }
        });

    } catch(err) {
        logger.error(`getRequiredRefData,Catch block error: ${err.stack}`);
        client.release();
        callback(err, 0);
    }
};

async function getNewGUID (queryToGenGUID, logParams, pool) {
    const logger = loggerUtils.customLogger( EventName, logParams);
    const client = await pool.connect();
    try {
        logger.info(`getNewGUID,pool connected successfully queryToGenGUID: ${queryToGenGUID}`);
        let response = await client.query(queryToGenGUID);
        client.release();
        let TransID = 'null'
        if ( response.rowCount > 0 ) {
            TransID = response.rows[0].generate_global_unique_id
        }
        return TransID;
    } catch (err) {
        console.log(`getNewGUID,ERROR in catch ${err.stack}`)
        client.release();
    }
}

async function insertData (text, logParams, pool) {
   
    const logger = loggerUtils.customLogger( EventName, logParams);
    logger.info(`asyncInsertData,insert Data query to execute: ${text} `);
    const client = await pool.connect();
    try {
        let response = await client.query(text);
        client.release();
        logger.info(`asyncInsertData,insert Data inserted rows count: ${response.rowCount}`);
        if (response.rowCount > 0) {
            return SUCCESS
        } else {
            return FAILURE
        }
    } catch(err) {
        client.release();
        logger.info(`asyncInsertData,catch block error: ${err.stack}`);
    }
}

module.exports = {
    getRequiredRefData,
    excSelectQuery,
    excUpdateQuery,
    getNewGUID,
    insertData
}
*/