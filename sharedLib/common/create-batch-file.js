'use strict'

const fs = require('fs')

exports.createBatchFile = async function (fileName, logger) {
    return new Promise((resolve, reject) => {
        const createBatchFile = fs.createWriteStream(fileName, {
            flags: 'a' // 'a' means appending (old data will be preserved)
        })
        resolve(createBatchFile);
    }).catch((err) => {
        logger.error(`populateKeyName, ERROR: ${err.stack}` )
    });
}