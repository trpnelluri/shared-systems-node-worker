'use strict';

async function padLeadingZeros(num, size) {
    return new Promise((resolve, reject) => {
        let retrunData = num + '';
        while (retrunData.length < size) { retrunData = '0' + retrunData; }
        resolve (retrunData)
    }).catch((error) => {
        console.error(`padLeadingZeros, ERROR: ${error}` )
    });
}

module.exports = {
    padLeadingZeros,
};