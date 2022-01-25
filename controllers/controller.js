'use strict'

const loggerUtils = require('../sharedLib/common/logger-utils');

const EventName = 'CONTROLLER'

const logger = loggerUtils.customLogger( EventName, {});

exports.default = async(req, res) => {
    logger.info(`default, req.headers: ${JSON.stringify(req.headers)}`)
    res.send('Welcome to Unissant');
};