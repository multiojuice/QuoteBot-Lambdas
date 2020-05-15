const AWS = require('aws-sdk');


const createQuote = async (message, text, db) => {
  const params = {
    Item: {
      id: {'S': `${message.chat.id}-${message.message_id}`},
      chat_id: {'S': `${message.chat.id}`},
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
  var params = {
    KeyConditionExpression: "#chatId = :chatId",
    ExpressionAttributeNames:{
        "#chatId": "chat_id"
    },
    ExpressionAttributeValues: {
        ":chatId": {'S': `${message.chat.id}`}
    },
    IndexName: "chat_id-index",
    ProjectionExpression: "id", 
    TableName: "quotes"
   };
   
  const {Items} = await db.query(params).promise();
  
  if(!Items.length || Items.length === 0) {
     return {
        statusCode: 200,
        isBase64Encoded: false,
        headers: {},
        body: JSON.stringify({
          method: 'sendMessage',
          chat_id: message.chat.id,
          text: "Error; try adding some quotes"
        })
    };
   }
  
  const randomIndex = Math.floor(Math.random() * Math.floor(Items.length));
  
  var getItemParams = {
    Key: {
     "id": Items[randomIndex].id
    }, 
    TableName: "quotes"
  };
  
  const {Item} = await db.getItem(getItemParams).promise();
  
  return {
    statusCode: 200,
    isBase64Encoded: false,
    headers: {},
    body: JSON.stringify({
      method: 'sendMessage',
      chat_id: message.chat.id,
      text: Item.text.S
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
  
  let splitIndex = message.text.indexOf(' ');
  if (splitIndex == -1) splitIndex = message.text.length;
  const command = message.text.slice(1, splitIndex);
  const text = message.text.slice(splitIndex);
  
  console.log('BLAH', splitIndex, command, text)
  
  switch (command) {
    case 'add':
    case 'add@quote_this_bot':
      if (text)
        return await createQuote(message, text, dynamodb);
      return {
        statusCode: 200,
        isBase64Encoded: false,
        headers: {},
        body: JSON.stringify({
          method: 'sendMessage',
          chat_id: message.chat.id,
          text: "Error; empty add"
        })
      };
    case 'r':
    case 'r@quote_this_bot':
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
