'use strict';

const loggerUtils = require('../../sharedLib/common/logger-utils');
const JSONToFlatFileRecService = require('../../sharedLib/common/convert-json-obj-to-flatfile-record');

const clsName = 'BuildDCFBodyDataSerivce';

let instance = null;

class BuildDCFBodyDataSerivce {

    static getInstance(){
        if(!instance){
            instance = new BuildDCFBodyDataSerivce();
        }
        return instance;
    }

    async buildDCFBodyInfo (guid, batchData, s3ConfigInfo) {
        const logParams = { globaltransid: guid };
        const logger = loggerUtils.customLogger(clsName, logParams);
        let bodyDataArray = [];
        try {
            const bodyAttributes = s3ConfigInfo.bodyattributes;
            logger.info(`buildDCFBodyInfo,bodyAttributes: ${bodyAttributes}` );
            for await (const eachRecord of batchData) {
                logger.debug(`buildDCFBodyInfo,eachRecord: ${JSON.stringify(eachRecord)}` );
                let bodyArray = [];
                let bodyObj = new Object;
                const bodyAttributesObj = bodyAttributes.split(',');
                bodyAttributesObj.forEach((element) => {
                    logger.debug(`buildDCFBodyInfo,element: ${element}`);
                    const bodyAttribute = element.trim();
                    const bodyAttrArray = bodyAttribute.split('^');
                    const bodyAttri = bodyAttrArray[0].toLowerCase().trim();
                    const bodyAttriVal = bodyAttrArray[1].trim();
                    if (bodyAttriVal !== 'null' ) {
                        if (bodyAttriVal.indexOf('~') > -1) {
                            let valuesArry = bodyAttriVal.split('~');
                            bodyObj[bodyAttri] = valuesArry[0];
                        } else {
                            if (eachRecord[bodyAttriVal]) {
                                if ( bodyAttri === 'rec_num') {
                                    let recNumber = eachRecord[bodyAttriVal]
                                    recNumber = recNumber.toString().padStart(7, '0');
                                    bodyObj[bodyAttri] = recNumber;
                                } else if ( bodyAttri === 'doc_cd_desc'){
                                    let docDescription = eachRecord[bodyAttriVal]
                                    docDescription = docDescription.padEnd(1000);
                                    bodyObj[bodyAttri] = docDescription;
                                } else {
                                    bodyObj[bodyAttri] = eachRecord[bodyAttriVal];
                                }
                            } else {
                                //ESMA-3709 bodyObj[bodyAttri] = 'null';
                                bodyObj[bodyAttri] = '';
                            }
                        }
                    } else {
                        logger.info(`buildDCFBodyInfo,filler: ${bodyAttriVal}`);
                        bodyObj[bodyAttri] = '';
                    }
                });
                bodyArray.push(bodyObj)
                logger.debug(`buildDCFBodyInfo,bodyArray.length: ${bodyArray.length}`);
                const bodyRecord = await JSONToFlatFileRecService.getInstance().convertObjDataToFlatFileRecord(bodyArray, guid, s3ConfigInfo.configfolder, s3ConfigInfo.bodyobj );
                logger.info(`buildDCFBodyInfo,bodyRecord.length: ${bodyRecord.length}`);
                bodyDataArray.push(bodyRecord);
            }
            return bodyDataArray;

        }catch(err) {
            logger.error(`buildDCFBodyInfo,ERROR: ${err.stack}` );
            throw Error(`buildDCFBodyInfo, ERROR in Catch: ${JSON.stringify(err)}`);
        }
        
    }
}

module.exports = BuildDCFBodyDataSerivce;