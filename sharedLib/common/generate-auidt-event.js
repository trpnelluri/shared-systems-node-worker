'use strict'
const loggerUtils = require('../common/logger-utils');
const SQSServiceShared = require('../aws/sqs-service');

const EventName = 'GenerateAuditEventSerivce'
const SUCCESS = 'Success'
const FAILURE = 'Failure'
let instance = null;

class GenerateAuditEventSerivce {

    static getInstance(){
        if(!instance){
            instance = new GenerateAuditEventSerivce();
        }
        return instance;
    }

    async generateAuditEvent ( glblUniqId, requiredEnvData ) {
        const logParams = { globaltransid: glblUniqId };
        const logger = loggerUtils.customLogger(EventName, logParams);
        try {
            let auditEventArray = [];
            let auditEventObj = new Object;
            const auditEventAttributes = requiredEnvData.auditeventdata
            const targetQueueQRL = requiredEnvData.auditqueueurl
            //const batchfilefor = requiredEnvData.batchfilefor
            logger.info(`generateAuditEvent,element: ${JSON.stringify(requiredEnvData)}`)
            const auditEventAttributesObj = auditEventAttributes.split(',');
            auditEventAttributesObj.forEach((element) => {
                logger.debug(`generateAuditEvent,element: ${element}`);
                const auditEventAttribute = element.toLowerCase().trim()
                const auditEventAttrArray = auditEventAttribute.split('^')
                const auditEventAttri = auditEventAttrArray[0]
                let auditEventAttriVal = auditEventAttrArray[1]
                //if ((auditEventAttri === 'audit_message') && ( batchfilefor === '5')) {
                if (auditEventAttri === 'audit_message') {
                    let auditMsg = auditEventAttriVal.toUpperCase()
                    const fileName = requiredEnvData.flatfilename
                    if (fileName) {
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
            auditEventArray.push(auditEventObj)
            logger.info(`generateAuditEvent,auditEventArray: ${JSON.stringify(auditEventArray)}`)
            const sendMsgRes = await SQSServiceShared.getInstance().sendMessage(auditEventArray, targetQueueQRL, logParams);
            logger.info(`generateAuditEvent,sendMsgRes: ${JSON.stringify(sendMsgRes)}`)
            if ( sendMsgRes ) {
                logger.debug(`generateAuditEvent,sendMsgRes: ${SUCCESS}`)
                return SUCCESS
            } else {
                logger.info(`generateAuditEvent,sendMsgRes: ${FAILURE}`)
                return FAILURE
            }
        } catch (err) {
            logger.error(`generateAuditEvent,ERROR catch: ${err.stack}`)
        }
    }
    
}

module.exports = GenerateAuditEventSerivce;
