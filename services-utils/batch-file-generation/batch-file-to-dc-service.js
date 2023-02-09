'use strict';

const loggerUtils = require('../../sharedLib/common/logger-utils');
const { createBatchFile, copyBatchFile } = require('../../sharedLib/common/create-batch-file');
const S3Service = require('../../sharedLib/aws/s3-service');

const SUCCESS = 'Success';
const clsName = 'BatchFileToDCService';
const bucketName = process.env.rc_files_upload_s3_bucket;
const directory = process.env.rc_files_upload_dir_in_s3;

let instance = null;

class BatchFileToDCService {

    static getInstance(){
        if(!instance){
            instance = new BatchFileToDCService();
        }
        return instance;
    }

    async batchFileToDC (reqDataToGenBatchFile, targetBatchFileName, batchFileCopyFlag, sourceBatchFileName, RCMailBox) {
        let logParams = {};
        const glblUniqId = reqDataToGenBatchFile.globaltransid;
        if ( glblUniqId ) {
            logParams = {globaltransid: glblUniqId};
        }
        const logger = loggerUtils.customLogger(clsName, logParams);
        try {
            const headerRecord = reqDataToGenBatchFile.headerdata;
            const trailerRecord = reqDataToGenBatchFile.trailerdata;
            const bodyData = reqDataToGenBatchFile.bodydata;
            const dateToday = reqDataToGenBatchFile.datetoday;
            const batchFileFor = reqDataToGenBatchFile.batchfilefor;
            const formattedDateTime = reqDataToGenBatchFile.formatteddatetime;
            logger.info(`batchFileToDC,batchFileFor: ${batchFileFor} batchFileCopyFlag: ${batchFileCopyFlag} targetBatchFileName: ${targetBatchFileName} sourceBatchFileName: ${sourceBatchFileName} formattedDateTime: ${formattedDateTime} RCMailBox: ${RCMailBox}`)
            if ( !batchFileCopyFlag && sourceBatchFileName === '' ) {
                const createBatFile = await createBatchFile(targetBatchFileName);
                await createBatFile.write(headerRecord + '\r\n');
                let k = 0;
                for (k = 0; k < bodyData.length; k++) {
                    let bodyRecord = '';
                    if ( batchFileFor === '5' || batchFileFor === '4' ) { //For SRVC and DCF generating the flat record in this worker
                        bodyRecord = bodyData[k];
                    } else {
                        bodyRecord = bodyData[k].flat_fil_rec_obj;
                    }
                    //NOTE: Only date time need to update in PA Req Flat file record
                    if ( batchFileFor !== '5' && batchFileFor !== '4') {
                        const dateFromBodyRec = bodyRecord.substring(6, 14);
                        logger.info(`batchFileToDC,dateFromBodyRec: ${dateFromBodyRec} dateToday: ${dateToday}`);
                        if ( dateToday !== dateFromBodyRec ) {
                            bodyRecord = bodyRecord.replace(dateFromBodyRec, dateToday);
                        }
                    }
                    await createBatFile.write(bodyRecord + '\r\n');
                }
                await createBatFile.write(trailerRecord);
                await createBatFile.close();
                return SUCCESS
            } else {
                //TBD: if the source batch file deleted immediatly we need to create the batch file in temp location and need to use that file to upload or copy to efs
                //const copyBatFile = await copyBatchFile(sourceBatchFileName, targetBatchFileName, logger);
                //const batchFileSize = await _calcBatchFileSize (sourceBatchFileName, logger)
                //logger.info(`batchFileToDC,copyBatFile Completed Successfully: ${copyBatFile}`);
                if (RCMailBox !== 'null' ){
                    const rcBatchFileName = reqDataToGenBatchFile.batchFileName;
                    let targetKey = directory + RCMailBox + '/' + rcBatchFileName;
                    let s3Service = await S3Service.getInstance();
                    let uploadObjRes = await s3Service.uploadObj( bucketName, sourceBatchFileName, targetKey, logParams);
                    logger.info(`batchFileToDC,RCBactch File '${targetKey}' has been uploaded Successfully: ${JSON.stringify(uploadObjRes)}`);
                } else { //ESMA-3710 (Added else if multiple DCfiles are generating with same data(DCF))
                    const copyBatFile = await copyBatchFile(sourceBatchFileName, targetBatchFileName, logger);
                    logger.info(`batchFileToDC,copyBatFile Completed Successfully: ${copyBatFile}`);
                }
                return SUCCESS;
            }
   
        } catch(err) {
            logger.error(`batchFileToDC,ERROR in catch: ${err.stack}`);
            throw new Error('batchFileToDC Completed with errors.');
        }
    }
}

module.exports = BatchFileToDCService