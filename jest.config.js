'use strict';

// vars for the unit-tests...
process.env.LOG_LEVEL = 'verbose';
process.env.JEST_REPORT_FILE = './coverage/mocha.json';

module.exports = {
    name: 'sharedsystemsworker',
    globals: {
        window: {}
    },
    collectCoverage: true,
    coverageThreshold: {
        global: {
            functions: 50,
            lines: 50,
            statements: -20
        }
    },
    collectCoverageFrom: [
        '**/*.js',
        '!**/node_modules/**',
        '!**/coverage*/**',
        '!sharedLib/aws/*',
        '!sharedLib/common/logger-utils.js',
        '!sharedLib/common/convert-json-obj-to-flatfile-record.js',
        '!sharedLib/common/create-batch-file.js',
        '!sharedLib/common/generate-auidt-event.js',
        '!sharedLib/common/holiday-check.js',
        '!sharedLib/common/sample-json-file.js',
        '!services-utils/batch-file-generation/*',
        '!services-utils/pa-requests/*',
        '!controllers/*',
        '!routes/*',
        '!services/*',
        '!app.js',
        '!**/*.config.js',
        '!**/*.init.js'
    ],
    coverageReporters: ['json', 'lcov', 'html', 'text'],
    testEnvironment: 'node',
    testResultsProcessor: 'jest-junit',
    verbose: true,
    silent: true
};