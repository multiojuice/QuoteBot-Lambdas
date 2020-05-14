const AWS = require('aws-sdk');


const createQuote = async (message, text, db) => {
  const params = {
    Item: {
      id: {'S': `${message.chat.id}-${message.message_id}`},
      text: {'S' : `${text}`},
      poster: {'S' : `${message.from.first_name} ${message.from.last_name}`}
    },
    TableName: 'quotes'
  }
  
  const response = await db.putItem(params).promise();
  
  console.log('CHAOS', response)
    
  return {
    statusCode: 200,
    isBase64Encoded: false,
    headers: {},
    body: JSON.stringify({
      method: 'sendMessage',
      chat_id: message.chat.id,
      text: "Successfully inserted"
    })
  };
}

const randomQuote = async (message, text, db) => {
  const params = {
    Item: {
      id: {'S': `${message.chat.id}-${message.message_id}`},
      text: {'S' : `${text}`},
      poster: {'S' : `${message.from.first_name} ${message.from.last_name}`}
    },
    TableName: 'quotes'
  }
  
  const response = await db.putItem(params).promise();
  
  console.log('CHAOS', response)
    
  return {
    statusCode: 200,
    isBase64Encoded: false,
    headers: {},
    body: JSON.stringify({
      method: 'sendMessage',
      chat_id: message.chat.id,
      text: "Successfully inserted"
    })
  };
}



exports.handler = async (event) => {
  const dynamodb = new AWS.DynamoDB();

  const {message} = JSON.parse(event.body)
  console.log('BOOM', event);
  
  if(!message || !message.entities || !message.entities[0] || message.entities[0].type !== 'bot_command') {
    return {
        statusCode: 200,
        isBase64Encoded: false,
        headers: {},
        body: JSON.stringify({
          method: 'sendMessage',
          chat_id: message.chat.id,
          text: "Error; no command"
        })
    };
  }
  
  const splitIndex = message.text.indexOf(' ');
  const command = message.text.slice(1, splitIndex);
  const text = message.text.slice(splitIndex);
  
  switch (command) {
    case 'add': 
      return await createQuote(message, text, dynamodb);
    case 'r':
      return await randomQuote(message, text, dynamodb);
    default:
      return {
        statusCode: 200,
        isBase64Encoded: false,
        headers: {},
        body: JSON.stringify({
          method: 'sendMessage',
          chat_id: message.chat.id,
          text: "Error; Unknown command or no command"
        })
      };
  }
};
