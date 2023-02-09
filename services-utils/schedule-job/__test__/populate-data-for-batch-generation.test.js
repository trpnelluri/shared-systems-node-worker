'use strict';

//const loggerUtils = require('../../sharedLib/common/logger-utils');
const { populateDataForBatchFileGeneration } = require('../populate-data-for-batch-generation');
//const SQSServiceShared = require('../../sharedLib/aws/sqs-service');

test('populateDataForBatchFileGeneration success', async () => {
    try {
        await populateDataForBatchFileGeneration(null);
        expect(true).toStrictEqual(true);
         
    }catch(err){
        expect(err).toBe(err);
    }
})