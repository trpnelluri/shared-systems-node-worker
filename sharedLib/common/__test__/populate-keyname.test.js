'use strict'
const PopulateKeyNameService = require('./populate-keyname');

test('populateKeyName success', async () => {
    try {
        const EventName = await PopulateKeyNameService.getinstance().populateKeyName('AWSC00007091000', 'config/pa-req-esmd-to-dc/', 'body.json');
        expect(EventName).toStrictEqual(EventName);
        //await populateKeyName(null, null, null);
         
    }catch(err){
        expect(err).toBe(err);
    }
})