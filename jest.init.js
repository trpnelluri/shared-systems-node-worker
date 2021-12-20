'use strict';

require('jest-extended');
global.fetch = require('jest-fetch-mock');

jest.setTimeout(30000);