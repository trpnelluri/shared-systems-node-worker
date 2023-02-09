'use strict'

const fs = require('fs')

exports.createBatchFile = async function (fileName, logger) {
    return new Promise((resolve, reject) => {
        const createBatchFile = fs.createWriteStream(fileName, {
            flags: 'w+'
            // 'a' means appending (old data will be preserved)
            // 'a+' - opens the file to read and write at the end of the file. 
            // 'w+' - opens the file to read and write at the beginning of the file
        })
        resolve(createBatchFile);
    }).catch((err) => {
        logger.error(`createBatchFile,ERROR: ${err.stack}` )
    });
}

exports.copyBatchFile = async function (sourceFileName, targetFileName, logger) {
    try {
        fs.createReadStream(sourceFileName).pipe(fs.createWriteStream(targetFileName));
        logger.info(`copyBatchFile, batchFile ${targetFileName} has been created Succesfully`)
        return 'Success'
    } catch(err) {
        logger.error(`copyBatchFile,ERROR: ${err.stack}`)
    }
    
}
