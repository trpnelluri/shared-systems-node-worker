'use strict';

const loggerUtils = require('../../sharedLib/common/logger-utils');
const JSONToFlatFileRecService = require('../../sharedLib/common/convert-json-obj-to-flatfile-record');

const clsName = 'BuildTrailerRecordService';

let instance = null;

class BuildTrailerRecordService {

    static getInstance(){
        if(!instance){
            instance = new BuildTrailerRecordService();
        }
        return instance;
    }

    async buildTrailerRecord (messageDataObj, s3ConfigInfo) {
        const logParams = {};
        const logger = loggerUtils.customLogger(clsName, logParams);
        try {
            const trailerAttributes = s3ConfigInfo.trailerattributes
            let trailerArray = [];
            let trailerObj = new Object;
            const trailerAttributesObj = trailerAttributes.split(',');
            trailerAttributesObj.forEach((element) => {
                logger.info(`buildTrailerRecord,element: ${element}`);
                const trailerAttribute = element.trim();
                const trailerAttrArray = trailerAttribute.split('^');
                const trailerAttri = trailerAttrArray[0].toLowerCase().trim();
                const trailerAttriVal = trailerAttrArray[1].trim();
                if (trailerAttriVal !== 'null' ) {
                    if (trailerAttriVal.indexOf('~') > -1) {
                        let valuesArry = trailerAttriVal.split('~');
                        trailerObj[trailerAttri] = valuesArry[0];
                    } else {
                        trailerObj[trailerAttri] = messageDataObj[trailerAttriVal];
                    }
                } else {
                    trailerObj[trailerAttri] = '';
                }
            });
            trailerArray.push(trailerObj);
            logger.info(`buildTrailerRecord,trailerObj: ${JSON.stringify(trailerArray)}`);
            const trailerRecord = await JSONToFlatFileRecService.getInstance().convertObjDataToFlatFileRecord(trailerArray, '', s3ConfigInfo.configfolder, s3ConfigInfo.trailerobj );
            logger.debug(`buildTrailerRecord,trailerRecord: ${trailerRecord}`);
            return trailerRecord;
        } catch(err) {
            logger.error(`buildTrailerRecord,ERROR: ${err.stack}` );
            throw Error(`buildTrailerRecord, ERROR in Catch: ${JSON.stringify(err)}`);
        }
    }

}



module.exports = BuildTrailerRecordService;