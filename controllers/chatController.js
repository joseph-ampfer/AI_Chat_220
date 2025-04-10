// controllers/chatController.js
// const { Configuration, OpenAIApi } = require('openai');
// const { OPENAI_API_KEY } = require('../config/keys');

// const configuration = new Configuration({
//   apiKey: OPENAI_API_KEY,
// });

// const openai = new OpenAIApi(configuration);

// async function callChatAPI(message) {
//   const completion = await openai.createChatCompletion({
//     model: 'gpt-3.5-turbo',
//     messages: [{ role: 'user', content: message }],
//   });

//   return completion.data.choices[0].message.content;
// }

// module.exports = { callChatAPI };