'use strict';

const fs = require('fs');

async function calcBatchFileSize (batchFilePath, logger) {
    try {
        const stats = fs.statSync(batchFilePath)
        const batchFileSize = stats.size;
        logger.info(`calcBatchFileSize,batchFileSize: '${batchFileSize}' bytes stats: ${JSON.stringify(stats)}`);
        return batchFileSize;
    }catch(err) {
        logger.error(`calcBatchFileSize,ERROR in catch: ${err.stack}`);
    }
}

module.exports = {
    calcBatchFileSize
};