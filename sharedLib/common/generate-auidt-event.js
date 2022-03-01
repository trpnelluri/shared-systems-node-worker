'use strict'
const loggerUtils = require('../common/logger-utils');
const SQSServiceShared = require('../aws/sqs-service');

const EventName = 'GENERATE_AUDIT_EVENT'
const SUCCESS = 'Success'
const FAILURE = 'Failure'

async function generateAuditEvent ( glblUniqId, requiredEnvData ) {
    const logParams = { globaltransid: glblUniqId };
    const logger = loggerUtils.customLogger(EventName, logParams);
    try {
        let auditEventArray = [];
        let auditEventObj = new Object;
        const auditEventAttributes = requiredEnvData.auditeventdata
        const targetQueueQRL = requiredEnvData.auditqueueurl
        const auditEventAttributesObj = auditEventAttributes.split(',');
        auditEventAttributesObj.forEach((element) => {
            logger.info(`generateAuditEvent, element: ${element}`)
            const auditEventAttribute = element.toLowerCase().trim()
            const auditEventAttrArray = auditEventAttribute.split('^')
            const auditEventAttri = auditEventAttrArray[0]
            const auditEventAttriVal = auditEventAttrArray[1]
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
        logger.info(`generateAuditEvent,  auditEventArray: ${JSON.stringify(auditEventArray)}`)
        const sendMsgRes = await SQSServiceShared.getInstance().sendMessage(auditEventArray, targetQueueQRL, logParams);
        logger.info(`generateAuditEvent,  sendMsgRes: ${JSON.stringify(sendMsgRes)}`)
        if ( sendMsgRes ) {
            logger.debug(`generateAuditEvent, sendMsgRes: ${SUCCESS}`)
            return SUCCESS
        } else {
            logger.info(`generateAuditEvent, sendMsgRes: ${FAILURE}`)
            return FAILURE
        }
    } catch (err) {
        logger.error(`generateAuditEvent, ERROR catch: ${err.stack}`)
    }
}

module.exports = {
    generateAuditEvent,
};