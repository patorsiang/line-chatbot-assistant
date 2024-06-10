/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

import {onRequest} from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import {pubsub} from "firebase-functions";
import {
  WebhookClient,
  type WebhookClient as WebhookClientType,
} from "dialogflow-fulfillment";
// for accessing the db connection
import * as NodeCache from "node-cache";
const myCache = new NodeCache();

import * as line from "./utils/line";
import * as gemini from "./utils/gemini";
import * as storage from "./utils/cloudstorage";
import * as firestore from "./utils/firestore";
import * as dialogflow from "./utils/dialogflow";
import {getCurrentGoldPrice} from "./utils/gold";
// Start writing functions
// https://firebase.google.com/docs/functions/typescript

// export const helloWorld = onRequest((request, response) => {
//   logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });

// Create a webhook via HTTP requests
exports.webhook = onRequest(async (req, res) => {
  if (req.method === "POST") {
    const events = req.body.events;

    for (const event of events) {
      const userId = event.source.userId;
      const replyToken = event.replyToken;
      const userData = await firestore.getUser(userId);

      let userMode = "bot";
      if (userData == undefined) {
        const profile = await line.getUserProfile(userId);
        await firestore.updateUser(userMode, profile.data);
      } else {
        userMode = userData.mode;
      }

      switch (event.type) {
      case "message":
        if (event.message.type === "text") {
          const notifyStatus = [
            ...((myCache.get("NotifyTheStaff") as Array<string>) ?? []),
          ];

          if (event.message.text.toLowerCase() == "mode") {
            await line.reply(replyToken, [
              {
                type: "text",
                text:
                    "ตอนนี้คุณอยู่ในโหมดคคุยกับ " +
                    userMode +
                    " หากต้องการเปลี่ยนโหมดสามารถเลือกได้เลยค่ะ",
                quickReply: {
                  items: [
                    {
                      type: "action",
                      action: {
                        type: "message",
                        label: "Bot",
                        text: "Bot",
                      },
                    },
                    {
                      type: "action",
                      action: {
                        type: "message",
                        label: "Staff",
                        text: "Staff",
                      },
                    },
                  ],
                },
              },
            ]);
            break;
          } else if (event.message.text.toLowerCase() == "gemini") {
            logger.log("Change mode to Gemini");
            await line.reply(replyToken, [
              {
                type: "text",
                text: "คุณได้เปลี่ยนเป็นโหมดคุยกับ Bot แล้ว สามารถสอบถามต่อได้เลยค่ะ",
              },
            ]);
            await firestore.updateUser("gemini", userData);
            break;
          } else if (event.message.text.toLowerCase() == "bot") {
            logger.log("Change mode to Bot");
            await line.reply(replyToken, [
              {
                type: "text",
                text: "คุณได้เปลี่ยนเป็นโหมดคุยกับ Bot แล้ว สามารถสอบถามต่อได้เลยค่ะ",
              },
            ]);
            await firestore.updateUser("bot", userData);
            break;
          } else if (event.message.text.toLowerCase() == "staff") {
            logger.log("Change mode to Staff");
            await line.reply(replyToken, [
              {
                type: "text",
                text: "คุณได้เปลี่ยนเป็นโหมดคุยกับ Staff แล้ว สามารถสอบถามต่อได้เลยค่ะ",
              },
            ]);
            await firestore.updateUser("staff", userData);
            break;
          }
          logger.log("User Mode " + userMode);

          if (userMode == "staff") {
            if (!notifyStatus.includes(userId)) {
              notifyStatus.push(userId);
              await line.notify({
                message:
                    "มีผู้ใช้ชื่อ " +
                    userData?.displayName +
                    " ต้องการติดต่อ " +
                    event.message.text,
                imageFullsize: userData?.pictureUrl,
                imageThumbnail: userData?.pictureUrl,
              });
              await line.reply(replyToken, [
                {
                  type: "text",
                  text: "เราได้แจ้งเตือนไปยัง Staff แล้วค่ะ รอสักครู่นะคะ",
                },
              ]);
            }
            myCache.set("NotifyTheStaff", notifyStatus, 600);
            break;
          } else if (userMode == "gemini") {
            const question = event.message.text;
            await line.loading(userId);
            const msg = await gemini.chat(question);
            console.log(msg);
            if (msg.includes("ขออภัยครับ ไม่พบข้อมูลดังกล่าว")) {
              await line.reply(replyToken, [
                {
                  type: "text",
                  text: "ขออภัยครับ ไม่พบข้อมูลดังกล่าว ตอนนี้คุณอยู่ในโหมดคคุยกับ Bot คุณสามารถถามคำถามต่อไป หรือหากต้องการเปลี่ยนโหมดเป็น Staff สามารถเลือกได้เลยค่ะ",

                  quickReply: {
                    items: [
                      {
                        type: "action",
                        action: {
                          type: "message",
                          label: "Staff",
                          text: "Staff",
                        },
                      },
                    ],
                  },
                },
              ]);
            } else {
              await line.reply(replyToken, [
                {
                  type: "text",
                  sender: {
                    name: "Gemini",
                    iconUrl: "https://wutthipong.info/images/geminiicon.png",
                  },
                  text: msg,
                },
              ]);
            }
          } else if (userMode == "bot") {
            await dialogflow.postToDialogflow(req as unknown as Request);
          }
        }
        if (event.message.type === "image") {
          const imageBinary = await line.getImageBinary(event.message.id);
          const msg = await gemini.multimodal(imageBinary);
          // deepcode ignore PT: TODO: come back later to handle it
          const urls = await storage.upload({
            timestamp: event.timestamp,
            userId: event.source.userId,
            imageBinary,
          });
          logger.log("REPLY IMG: ", msg);
          logger.log("REPLY RESIZED IMG: ", urls);
          // await line.reply(event.replyToken, [{type: "text", text: msg}]);
          await line.replyResizeImg(event.replyToken, msg, urls);

          break;
        }
        break;
      }
    }
  }
  res.send(req.method);
});

exports.gold = pubsub
  .schedule("0 */1 * * *")
  .timeZone("Asia/Bangkok")
  .onRun(async () => {
    const priceCurrent = (await getCurrentGoldPrice()) || "";

    logger.log(priceCurrent);

    const priceLast = await firestore.getLastGoldPrice();
    if (!priceLast.exists || priceLast.data()?.price !== priceCurrent) {
      firestore.updateGoldPrice(priceCurrent);
      line.broadcast(priceCurrent);
      logger.log("BROADCAST:", priceCurrent);
    }

    return null; // Add this line to ensure all code paths return a value
  });

process.env.DEBUG = "dialogflow:debug";

exports.dialogflowFirebaseFulfillment = onRequest((request, response) => {
  const agent = new WebhookClient({request, response});
  logger.log("Dialogflow Request headers: " + JSON.stringify(request.headers));
  logger.log("Dialogflow Request body: " + JSON.stringify(request.body));

  const welcome = (agent: WebhookClientType) => {
    agent.add("Welcome to my agent!");
  };

  const fallback = async (agent: WebhookClientType) => {
    const userId =
      request.body.originalDetectIntentRequest.payload.data.source.userId;
    const replyToken =
      request.body.originalDetectIntentRequest.payload.data.replyToken;

    const question = "คุณต้องการสอบถามกับ Bot หรือ Staff";
    const answer1 = "สอบถามกับ Bot " + agent.query;
    const answer2 = "สอบถามกับ Staff " + agent.query;

    logger.log("UserId: " + userId);
    let mode = myCache.get(userId);
    logger.log("Mode: " + mode);
    if (mode === undefined) {
      mode = "Dialogflow";
    }

    let notifyStatus = myCache.get("Notify" + userId);
    if (notifyStatus === undefined) {
      notifyStatus = true;
    }

    if (agent.query == "reset") {
      mode = "Dialogflow";
      logger.log("Change Mode to: " + mode);
      await line.reply(replyToken, [
        {
          type: "text",
          text: "ระบบตั้งค่าเริ่มต้นให้คุณแล้ว สอบถามได้เลยค่ะ",
        },
      ]);
      myCache.set(userId, mode, 600);
      logger.log("Lastest Mode: " + mode);
    }

    let modifiedQuery = agent.query;
    if (mode == "bot") {
      modifiedQuery = "สอบถามกับ Bot" + modifiedQuery;
    } else if (mode == "staff") {
      modifiedQuery = "สอบถามกับ Staff" + agent.query;
    }

    if (modifiedQuery.includes("สอบถามกับ Staff")) {
      mode = "staff";
      logger.log("Change Mode to: " + mode);
      const profile = await line.getUserProfile(userId);
      logger.log(profile.data);
      if (notifyStatus) {
        line.notify({
          message:
            "มีผู้ใช้ชื่อ " +
            profile.data.displayName +
            " ต้องการติดต่อ " +
            modifiedQuery,
          imageFullsize: profile.data.pictureUrl,
          imageThumbnail: profile.data.pictureUrl,
        });
        await line.reply(replyToken, [
          {
            type: "text",

            text:
              modifiedQuery +
              " เราได้แจ้งเตือนไปยัง Staff แล้วค่ะ Staff จะรีบมาตอบนะคะ",
          },
        ]);
      }
      myCache.set("Notify" + userId, false, 600);
    } else if (modifiedQuery.includes("สอบถามกับ Bot")) {
      mode = "bot";
      logger.log("Change Mode to: " + mode);
      let question = modifiedQuery;
      question = question.replace("สอบถามกับ Bot", "");
      const msg = await gemini.chat(question);
      await line.reply(replyToken, [
        {
          type: "text",
          sender: {
            name: "Gemini",
            iconUrl: "https://wutthipong.info/images/geminiicon.png",
          },
          text: msg,
        },
      ]);
    } else {
      mode = "Dialogflow";

      await line.reply(replyToken, [
        {
          type: "text",
          text: question,
          sender: {
            name: "Dialogflow",
            // iconUrl: "https://wutthipong.info/images/geminiicon.png",
          },
          quickReply: {
            items: [
              {
                type: "action",
                action: {
                  type: "message",
                  label: "สอบถามกับ Bot",
                  text: answer1,
                },
              },
              {
                type: "action",
                action: {
                  type: "message",
                  label: "สอบถามกับ Staff",
                  text: answer2,
                },
              },
            ],
          },
        },
      ]);
    }

    myCache.set(userId, mode, 600);
    logger.log("Lastest Mode: " + mode);
  };

  const bodyMassIndex = (agent: WebhookClientType) => {
    const weight = agent.parameters.weight as unknown as number;
    const height = (agent.parameters.height as unknown as number) / 100;
    const bmi = Number((weight / (height * height)).toFixed(2));
    let result = "ขออภัย หนูไม่เข้าใจ";

    if (bmi < 18.5) {
      result = "คุณผอมไป กินข้าวบ้างนะ";
    } else if (bmi >= 18.5 && bmi <= 22.9) {
      result = "คุณหุ่นดีจุงเบย";
    } else if (bmi >= 23 && bmi <= 24.9) {
      result = "คุณเริ่มจะท้วมแล้วนะ";
    } else if (bmi >= 25.8 && bmi <= 29.9) {
      result = "คุณอ้วนละ ออกกำลังกายหน่อยนะ";
    } else if (bmi > 30) {
      result = "คุณอ้วนเกินไปละ หาหมอเหอะ";
    }
    agent.add(result);
  };

  const intentMap = new Map();
  intentMap.set("Default Welcome Intent", welcome);
  intentMap.set("Default Fallback Intent", fallback);
  intentMap.set("BMI - custom - yes", bodyMassIndex);
  agent.handleRequest(intentMap);
});
