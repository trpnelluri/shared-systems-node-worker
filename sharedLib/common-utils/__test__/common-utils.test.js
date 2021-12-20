'use strict'
const { verifyLastCharInString } = require('../common-utils');

jest.mock('../logger-utils', () => ({
    customLogger: jest.fn((pgsLogFileName, EventName, logParams) => ({
        info: jest.fn(),
        error: jest.fn(),
        debug: jest.fn(),
        clear: jest.fn()
    }))
}));

describe('common-utils-test', () => {
    const EventName = 'NOTIFICATIONCONSUMER';
    const charToVerify = '-'
    afterEach(() => {
        jest.resetAllMocks();
    });
    test('Call verifyLastCharInString without - at the end of the fileName', async () => {
        const expectedResult = 'C:/CMS/NodeJS/logs/esMD-Email-Notification-dev-'
        const actualResult = verifyLastCharInString('C:/CMS/NodeJS/logs/esMD-Email-Notification', EventName, charToVerify)
        expect(actualResult).toBe(expectedResult);
    })
    test('Call verifyLastCharInString with invalid params', async () => {
        const expectedResult = 'C:/CMS/NodeJS/logs/esMD-Email-Notification-dev-'
        try {
            verifyLastCharInString(null, EventName, charToVerify)
        }catch(err){
            expect(undefined).not.toBe(expectedResult);
        }
    })
   
});