'use strict'

const express = require('express');
const controller = require('../controllers/controller');

const router = express.Router();

router.get('/', controller.default);

router.get('/holidaysList', controller.holidaysList);

router.get('/BatchFile', controller.generateBatchFile);

module.exports = router;