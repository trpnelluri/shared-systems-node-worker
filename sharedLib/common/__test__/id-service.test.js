'use strict';

const IdService = require('../id-service');
let service;

describe('id-service-test', () => {

    beforeAll(() => {
        service = IdService.getInstance();
    });
    describe('initialize', () => {
        test('module is loaded', () => {
            expect(service).toBeInstanceOf(IdService);
        });

        test('reinitialization of the module returns the same', async () => {
            const reInitService = await IdService.getInstance();
            expect(reInitService).toBe(service);
        });
    });

    describe('id generation', () => {
        test('will generate an id', async () => {
            const id = service.getId();
            console.log(id);
            expect(id).not.toBeNull();
        });
    });
});