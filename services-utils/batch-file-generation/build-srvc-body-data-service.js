'use strict';

const loggerUtils = require('../../sharedLib/common/logger-utils');
const JSONToFlatFileRecService = require('../../sharedLib/common/convert-json-obj-to-flatfile-record');

const clsName = 'BuildSRVCBodyDataSerivce';

let instance = null;

class BuildSRVCBodyDataSerivce {

    static getInstance(){
        if(!instance){
            instance = new BuildSRVCBodyDataSerivce();
        }
        return instance;
    }

    async buildSRVCBodyInfo (guid, batchData, s3ConfigInfo) {
        const logParams = { globaltransid: guid };
        const logger = loggerUtils.customLogger(clsName, logParams);
        let bodyDataArray = [];
        try {
            const bodyAttributes = s3ConfigInfo.bodyattributes;
            logger.info(`buildSRVCBodyInfo,bodyAttributes: ${bodyAttributes}` );
            for await (const eachRecord of batchData) {
                logger.debug(`buildSRVCBodyInfo,eachRecord: ${JSON.stringify(eachRecord)}` );
                let bodyArray = [];
                let bodyObj = new Object;
                const bodyAttributesObj = bodyAttributes.split(',');
                bodyAttributesObj.forEach((element) => {
                    logger.info(`buildSRVCBodyInfo,element: ${element}`);
                    const bodyAttribute = element.trim();
                    const bodyAttrArray = bodyAttribute.split('^');
                    const bodyAttri = bodyAttrArray[0].toLowerCase().trim();
                    const bodyAttriVal = bodyAttrArray[1].trim();
                    if (bodyAttriVal !== 'null' ) {
                        if (bodyAttriVal.indexOf('~') > -1) {
                            let valuesArry = bodyAttriVal.split('~');
                            bodyObj[bodyAttri] = valuesArry[0];
                        } else {
                            if ( bodyAttri === 'dateofchange' && eachRecord[bodyAttriVal] !== null) {
                                //Format the dateofchange to MM-DD-YYYY
                                let dateTobeChange = new Date(eachRecord[bodyAttriVal]);
                                let day = dateTobeChange.getDate();
                                let month = dateTobeChange.getMonth() + 1;
                                let year = dateTobeChange.getFullYear();
                                month = (month < 10 ? '0' : '') + month;
                                day = (day < 10 ? '0' : '') + day;
                                let formattedDate = month + '-' + day + '-' + year;
                                bodyObj[bodyAttri] = formattedDate;
                            } else {
                                bodyObj[bodyAttri] = eachRecord[bodyAttriVal];
                            }
                        }
                    } else {
                        bodyObj[bodyAttri] = '';
                    }
                });
                bodyArray.push(bodyObj)
                logger.debug(`buildSRVCBodyInfo,bodyArray: ${JSON.stringify(bodyArray)}`);
                const bodyRecord = await JSONToFlatFileRecService.getInstance().convertObjDataToFlatFileRecord(bodyArray, '', s3ConfigInfo.configfolder, s3ConfigInfo.bodyobj );
                logger.info(`buildHeaderRecord,headerRecord: ${bodyRecord} bodyRecord.length: ${bodyRecord.length}`);
                bodyDataArray.push(bodyRecord);
            }
            return bodyDataArray;

        }catch(err) {
            logger.error(`buildSRVCBodyInfo,ERROR: ${err.stack}` );
            throw Error(`buildSRVCBodyInfo, ERROR in Catch: ${JSON.stringify(err)}`);
        }
    }
}

module.exports = BuildSRVCBodyDataSerivce;