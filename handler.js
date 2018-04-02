const twilio = require('twilio');
const AWS = require('aws-sdk');

const dynamoDb = new AWS.DynamoDB.DocumentClient();
const client = new twilio(process.env.TWILIO_SID, process.env.TWILIO_TOKEN)

const UNLOCK_TIMEOUT = parseInt(process.env.UNLOCK_TIMEOUT);
const ADMINS = process.env.ADMINS.split(',');
const SMS_FROM = process.env.SMS_FROM;
const BUZZ_DIGIT = process.env.BUZZ_DIGIT;

module.exports.receiveSMS = function(event, context, callback) {
  const response = new twilio.twiml.MessagingResponse();
  response.message(`Door will auto buzz for the next ${UNLOCK_TIMEOUT} seconds`);

  dynamoDb.put({
    TableName: process.env.DYNAMODB_TABLE,
    Item: {
      key: 'open',
      expires: new Date().getTime() + (UNLOCK_TIMEOUT * 1000)
    }
  }).promise()
  .then(() => {
    callback(null, {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/xml'
      },
      body: response.toString()
    });
  })
  .catch(error => {
    console.error(error);
    callback(null, {
      statusCode: 500,
      headers: {
        'Content-Type': 'text/plain'
      },
      body: 'Failed to set status'
    });
  });
}

module.exports.receiveCall = function(event, context, callback) {
  const response = new twilio.twiml.VoiceResponse();

  dynamoDb.get({
    TableName: process.env.DYNAMODB_TABLE,
    Key: {
      key: 'open'
    }
  }).promise()
  .then(result => {
    if (result.Item && new Date().getTime() < result.Item.expires) {
      console.log('Opening door', result.Item.expires, new Date().getTime());
      response.play({
        digits: `ww${BUZZ_DIGIT}`
      });

      return Promise.all(
        ADMINS.map(num => {
          return client.messages.create({
            to: num,
            from: SMS_FROM,
            body: "Just buzzed someone up"
          });
        })
      );
    } else {
      console.log('Not opening door', result.Item, new Date().getTime());
      const dial = response.dial();

      for (const num of ADMINS) {
        dial.number(num);
      }
    }
  })
  .then(() => {
    callback(null, {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/xml'
      },
      body: response.toString()
    });
  })
  .catch(error => {
    console.error(error);
    callback(null, {
      statusCode: 500,
      headers: {
        'Content-Type': 'text/plain'
      },
      body: 'Failed to buzz'
    });
    return;
  });
}
