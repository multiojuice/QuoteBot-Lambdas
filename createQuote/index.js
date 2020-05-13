const AWS = require('aws-sdk');
const fetch = require('node-fetch');

exports.handler = async (event) => {
    console.log('BOOM', event.body);
    
    const  response = await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_KEY}/sendMessage`, {
      method: 'POST',
      body: JSON.stringify({
        chat_id: event.body.chat.id,
        text: 'This is working'
      })
    });
    
    console.log('CHAOS', event.body);
    
    return response;
};
