const AWS = require('aws-sdk');
const axios = require('axios');

exports.handler = async (event) => {
    console.log('BOOM', event.body);
    
    const response = await axios.post(
      `https://api.telegram.org/bot${process.env.TELEGRAM_KEY}/sendMessage`,
      {
        chat_id: JSON.parse(event.body).message.chat.id,
        text: "Polo!!"
      }
    );
  
    console.log('CHAOS', response);
    
    return response;
};
