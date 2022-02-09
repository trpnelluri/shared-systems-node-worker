'use strict'

const AWS = require('aws-sdk');

const client = new AWS.SecretsManager({
    region: process.env.AWS_REGION || 'us-east-1',
});

/*
The follwoing fucntion is used to load the AWS RDS postgresSQL DB connection details from AWS SecretsManager Service.
*/
exports.getDBConnDetails = function (params, logger, callback) {
    logger.info (`getDBConnDetails, params: ${JSON.stringify(params)}`)
    client.getSecretValue(params, (err, data) => {
        if (err) {
            logger.error(`getDBConnDetails, ERROR: ${err.stack}`)
            callback(err, data);
        } else {
            logger.debug(`getDBConnDetails, Successfully retrevied the DBConnection details from SecretManager data: ${data.SecretString}`)
            const returnData = data.SecretString;
            callback(null, returnData);
        }
    });
};