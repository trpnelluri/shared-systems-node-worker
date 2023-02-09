'use strict';

const loggerUtils = require('../../sharedLib/common/logger-utils');
const JSONToFlatFileRecService = require('../../sharedLib/common/convert-json-obj-to-flatfile-record');

const clsName = 'BuildHeaderRecordService';

let instance = null;

class BuildHeaderRecordService {

    static getInstance(){
        if(!instance){
            instance = new BuildHeaderRecordService();
        }
        return instance;
    }

    async buildHeaderRecord (messageDataObj, s3ConfigInfo) {
        const logParams = {};
        const logger = loggerUtils.customLogger(clsName, logParams);
        try {
            const headerAttributes = s3ConfigInfo.headerattributes
            let headerArray = [];
            let headerObj = new Object;
            const headerAttributesObj = headerAttributes.split(',');
            headerAttributesObj.forEach((element) => {
                logger.info(`buildHeaderRecord,element: ${element}`);
                const headerAttribute = element.trim();
                const headerAttrArray = headerAttribute.split('^');
                const headerAttri = headerAttrArray[0].toLowerCase().trim();
                const headerAttriVal = headerAttrArray[1].trim();
                if (headerAttriVal !== 'null' ) {
                    if (headerAttriVal.indexOf('~') > -1) {
                        let valuesArry = headerAttriVal.split('~');
                        headerObj[headerAttri] = valuesArry[0];
                    } else {
                        headerObj[headerAttri] = messageDataObj[headerAttriVal];
                    }
                } else {
                    headerObj[headerAttri] = '';
                }
            });
            headerArray.push(headerObj);
            logger.info(`buildHeaderRecord,headerArray: ${JSON.stringify(headerArray)}`);
            const headerRecord = await JSONToFlatFileRecService.getInstance().convertObjDataToFlatFileRecord(headerArray, '', s3ConfigInfo.configfolder, s3ConfigInfo.headerobj );
            logger.debug(`buildHeaderRecord,headerRecord: ${headerRecord}`);
            return headerRecord;
        } catch (err) {
            logger.error(`buildHeaderRecord,ERROR: ${err.stack}` );
            throw Error(`buildHeaderRecord, ERROR in Catch: ${JSON.stringify(err)}`);
        }
    }
}

module.exports = BuildHeaderRecordService
