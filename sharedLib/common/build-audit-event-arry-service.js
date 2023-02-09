'use strict'
const lodash = require('lodash');
const loggerUtils = require('../common/logger-utils');
const SQSServiceShared = require('../aws/sqs-service');

const EventName = 'BuildBulkAuditEventSerivce'
const SUCCESS = 'Success'
//const FAILURE = 'Failure'
const maxNoOfAuditEntries = 20;
let instance = null;
class BuildBulkAuditEventSerivce {

    static getInstance(){
        if(!instance){
            instance = new BuildBulkAuditEventSerivce();
        }
        return instance;
    }

    async buildBulkAuditEventArry (glblUniqId, requiredEnvData) {
        const logParams = {};
        const logger = loggerUtils.customLogger(EventName, logParams);
        try {
            let auditEventArray = [];
            const auditEventAttributes = requiredEnvData.auditeventdata
            const targetQueueQRL = requiredEnvData.auditqueueurl
            let dataToInsertAudit = requiredEnvData.processeddata
            const fileName = requiredEnvData.flatfilename
            if (dataToInsertAudit) {
                if ( !(lodash.isEmpty(dataToInsertAudit))) {
                    const noOfRecords = dataToInsertAudit.length;
                    let i = 0;
                    for await (const eachRecord of dataToInsertAudit) {
                        glblUniqId = eachRecord.glbl_uniq_id;
                        logger.info(`buildBulkAuditEventArry,eachRecord: ${JSON.stringify(eachRecord)} globalTransID: ${glblUniqId}`);
                        const auditEventObjRes = await _PopulateAuditEventData (logger, glblUniqId, auditEventAttributes, fileName);
                        auditEventArray.push(auditEventObjRes)
                        i += 1
                        if (i % maxNoOfAuditEntries === 0 || i === noOfRecords ) {
                            logger.info(`buildBulkAuditEventArry,auditEventArray: ${JSON.stringify(auditEventArray)}`)
                            const logParams = { globaltransid: glblUniqId };
                            const sendMsgRes = await SQSServiceShared.getInstance().sendMessage(auditEventArray, targetQueueQRL, logParams);
                            logger.info(`buildBulkAuditEventArry,sendMsgRes: ${JSON.stringify(sendMsgRes)}`)
                            if ( sendMsgRes ) {
                                if ( i === noOfRecords ) {
                                    logger.info(`buildBulkAuditEventArry,Successfully sent all the Audit entries i: '${i}' noOfRecords: '${noOfRecords}'`)
                                    return SUCCESS
                                }
                            }
                        }
                    }
                }
            }

        }catch(err) {
            logger.error(`buildBulkAuditEventArry,ERROR catch: ${err.stack}`)
        }

    }
}

async function _PopulateAuditEventData (logger, glblUniqId, auditEventAttributes, fileName) {
    try {
        let auditEventObj = new Object;
        const auditEventAttributesObj = auditEventAttributes.split(',');
        auditEventAttributesObj.forEach((element) => {
            const auditEventAttribute = element.toLowerCase().trim()
            const auditEventAttrArray = auditEventAttribute.split('^')
            const auditEventAttri = auditEventAttrArray[0]
            let auditEventAttriVal = auditEventAttrArray[1]
            if (auditEventAttri === 'audit_message') {
                let auditMsg = auditEventAttriVal.toUpperCase()
                if ( auditMsg.indexOf('{0}') > 0 ) {
                    auditMsg = auditMsg.replace('{0}', fileName)
                }
                auditEventAttriVal = auditMsg
            }
            if (auditEventAttriVal !== 'null' ) {
                if (auditEventAttriVal === 'transaction_id') {
                    auditEventObj[auditEventAttri] = glblUniqId
                } else if (auditEventAttriVal === 'date_timestamp') {
                    auditEventObj[auditEventAttri] = new Date();
                } else {
                    auditEventObj[auditEventAttri] = auditEventAttriVal.toUpperCase()
                }
            } else {
                auditEventObj[auditEventAttri] = ''
            }
        })
        return auditEventObj
    } catch (err) {
        logger.error(`_PopulateAuditEventData,ERROR catch: ${err.stack}`)
    }
}

module.exports = BuildBulkAuditEventSerivce;