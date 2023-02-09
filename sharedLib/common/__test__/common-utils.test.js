'use strict'
const { padLeadingZeros } = require('../common-utils');

test('padLeadingZeros success', async () => {
    
    const data = await padLeadingZeros(5, 5);
    expect(data).toStrictEqual('00005');
})