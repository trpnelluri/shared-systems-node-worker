'use strict'

const express = require('express');
const controller = require('../controllers/controller');

const router = express.Router();

router.get('/', controller.default);

module.exports = router;