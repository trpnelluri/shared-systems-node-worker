'use strict'
const { connectToPostgresDB, insertData, } = require('../postgre-sql-pool');
const { Pool } = require('pg');
const getDBConnInfo = require('../../aws/db-conn-details-from-ssm');
//const loggerUtils = require('../../common/logger-utils');
  
//let logFileNameFromEnv = process.env.pgs_log_filename;
//const EventName = 'POSTGRESDBSERVICE';
jest.mock('pg', () => {
    const mPool = {
        connect: jest.fn(() => ({
            query: jest.fn((file, fileName, callback) =>
                callback(null, { rows: [], rowCount: 0 })
            ),
            release: jest.fn(),
        })),
        acquire: jest.fn(),
        error: jest.fn(),
        on: jest.fn(),
        query: jest.fn((file, fileName, callback) =>
            callback(null, { rows: [], rowCount: 0 })
        ),
        release: jest.fn(),
    };
    return { Pool: jest.fn(() => mPool) };
});
  
jest.mock('../../aws/db-conn-details-from-ssm', () => {
    return {
        getDBConnDetails: jest.fn((params, logger, callback) =>
            callback(null, {
               
                user: 'postgres',
                host: 'test123',
                database: 'test123',
                password: 'Password123',
                port: 5432,
            })
        ),
    };
});
  
jest.mock('../../common/logger-utils', () => ({
    customLogger: jest.fn((EventName, logParams) => ({
        info: jest.fn(),
        error: jest.fn(),
        debug: jest.fn(),
        clear: jest.fn(),
    })),
}));
  
jest.mock('../../common/common-utils', () => ({
    verifyLastCharInString: jest.fn(),
}));
  
describe('postgre-sql-pool-test', () => {
    const dbData = JSON.stringify({
       
        user: 'postgres',
        host: 'test123',
        database: 'test123',
        password: 'Password123',
        port: 5432,
    });
  
    let pool;
  
    beforeEach(() => {
        pool = new Pool();
    });
  
    afterEach(() => {
        jest.clearAllMocks();
    });
  
    test('should call connectToPostgresDB function with success', async () => {
        let queryCallback;
        getDBConnInfo.getDBConnDetails.mockImplementation(
            (params, logger, callback) => {
                queryCallback = callback;
            }
        );
        connectToPostgresDB();
        queryCallback(null, dbData);
        expect(getDBConnInfo.getDBConnDetails).toBeCalledTimes(1);
        expect(pool.on).toBeCalledTimes(3);
    });
  
    test('should call connectToPostgresDB function with success', async () => {
        getDBConnInfo.getDBConnDetails.mockImplementation(() => {
            throw new Error('');
        });
        connectToPostgresDB();
        expect(getDBConnInfo.getDBConnDetails).toBeCalledTimes(1);
    });
 
    test('should call insertData callback function with success', async () => {
        const mockCallback = jest.fn();
        pool.query.mockResolvedValue({ rows: [] });
        let queryCallback;
        pool.query.mockImplementation((text, callback) => {
            queryCallback = callback;
        });
  
        await insertData('text', {}, mockCallback, pool);
        queryCallback(true, null);
        expect(pool.query).toBeCalledTimes(1);
        expect(mockCallback).toBeCalledTimes(1);
    });
  
    test('should call insertData function with error', async () => {
        const mockCallback = jest.fn();
        pool.query.mockImplementation(() => {
            throw new Error('');
        });
  
        await insertData('text', {}, mockCallback, pool);
        expect(pool.connect).toBeCalledTimes(1);
        expect(pool.query).toBeCalledTimes(1);
        expect(mockCallback).toBeCalledTimes(1);
    });
});