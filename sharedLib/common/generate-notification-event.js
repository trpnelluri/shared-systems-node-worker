'use strict'
const loggerUtils = require('../common/logger-utils');
const SQSServiceShared = require('../aws/sqs-service');
const IdServiceShared = require('./id-service')

const clsName = 'GenerateNotificationEventSerivce'
const SUCCESS = 'Success'
const FAILURE = 'Failure'

let instance = null;

class GenerateNotificationSerivce {
    static getInstance(){
        if(!instance){
            instance = new GenerateNotificationSerivce();
        }
        return instance;
    }

    async generateNotificationEvent(glblUniqId, notificationEventData) {

        const logParams = {globaltransid: glblUniqId}
        const logger = loggerUtils.customLogger(clsName, logParams);
    
        try {
            logger.info(`generateNotificationEvent,notificationEventData: ${JSON.stringify(notificationEventData)}}`)
            let notificationObj = new Object;
            const targetQueueQRL = notificationEventData.notifyqueueurl
            notificationObj.guid = glblUniqId
            notificationObj.email_alert_notification_type = notificationEventData.notificationtype
            notificationObj.flat_filename = notificationEventData.flatfilename
            notificationObj.csv_filename = notificationEventData.csvfilename
            notificationObj.request_type = 'SharedSystems'
            notificationObj.environment_type = process.env.environment
            notificationObj.submission_timestamp = new Date();

            let msgBody = JSON.stringify(notificationObj)
            let messageGroupId = IdServiceShared.getInstance().getId();
            const sendMsgParams = {
                MessageBody: msgBody,
                QueueUrl: targetQueueQRL,
                MessageGroupId: messageGroupId,
                MessageDeduplicationId: messageGroupId,
            }
            logger.info(`generateNotificationEvent,messageGroupId: ${messageGroupId} sendMsgParams: ${JSON.stringify(sendMsgParams)}`)
            const sendMsgRes = await SQSServiceShared.getInstance().sendMessage(notificationObj, targetQueueQRL, logParams);
            logger.info(`generateAuditEvent,sendMsgRes: ${JSON.stringify(sendMsgRes)}`)
            if ( sendMsgRes ) {
                logger.debug(`generateAuditEvent,sendMsgRes: ${SUCCESS}`)
                return SUCCESS
            } else {
                logger.info(`generateAuditEvent,sendMsgRes: ${FAILURE}`)
                return FAILURE
            }
            
        } catch(err){
            logger.error(`generateAuditEvent,ERROR catch: ${err.stack}`)
        }
    }
   
}

module.exports = GenerateNotificationSerivce;