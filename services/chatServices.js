const { ObjectId } = require("mongodb");
const db = require("../db");

async function fetchTextOnlyConversation(chatId, userId) {
  // This junk is to allow vision models and txt models to overlap
  // Getting only text for txt models, the imageurls for image models
  const pipeline = [
    { $match: { _id: new ObjectId(chatId), userId: userId } },
    {
      $project: {
        _id: false,
        conversation: {
          $map: {
            input: "$conversation",
            as: "msg",
            in: {
              role: "$$msg.role",
              content: {
                $cond: [
                  { $isArray: "$$msg.content" },
                  // If it’s an array, find the text block and extract its `.text`
                  {
                    $first: {
                      $map: {
                        input: {
                          $filter: {
                            input: "$$msg.content",
                            as:    "blk",
                            cond:  { $eq: [ "$$blk.type", "text" ] }
                          }
                        },
                        as:    "t",
                        in:    "$$t.text"
                      }
                    }
                  },
                  "$$msg.content"
                ]
              }
            }
          }
        }
    }}
  ];
  const chatArr = await db.collection('chats').aggregate(pipeline).toArray();
  return chatArr[0]?.conversation || [];
}

module.exports = { fetchTextOnlyConversation };