/* eslint-disable max-len */
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
import * as openai from "./utils/openai";
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
      switch (event.type) {
      case "message":
        if (event.message.type === "text") {
          await dialogflow.postToDialogflow(req as unknown as Request);
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
          await line.loading(userId);
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

exports.dialogflowFirebaseFulfillment = onRequest(async (request, response) => {
  const agent = new WebhookClient({request, response});
  logger.log("Dialogflow Request headers: " + JSON.stringify(request.headers));
  logger.log("Dialogflow Request body: " + JSON.stringify(request.body));

  const userId =
    request.body.originalDetectIntentRequest.payload.data.source.userId;
  const replyToken =
    request.body.originalDetectIntentRequest.payload.data.replyToken;

  const userData = await firestore.getUser(userId);

  let userMode = "Gemini";
  if (userData == undefined) {
    const profile = await line.getUserProfile(userId);
    await firestore.updateUser(userMode, profile.data);
  } else {
    userMode = userData.mode;
  }

  const fallback = async (agent: WebhookClientType) => {
    logger.log("Fallback User Mode " + userMode);
    switch (userMode.toLocaleLowerCase()) {
    case "gemini": {
      const msg = await gemini.chat(agent.query);
      await line.reply(replyToken, [
        {
          type: "text",
          sender: {
            name: "Gemini",
            // iconUrl: "https://wutthipong.info/images/geminiicon.png",
            iconUrl: `https://firebasestorage.googleapis.com/v0/b/patorsiangassistant.appspot.com/o/profile_icon%2Fgemini.png?alt=media&token=${process.env.GEMINI_ICON_TOKEN}`,
          },
          text: msg,
        },
      ]);
      break;
    }
    case "chatgpt": {
      const msg = await openai.chat(agent.query);
      await line.reply(replyToken, [
        {
          type: "text",
          sender: {
            name: "ChatGPT",
            // iconUrl: "https://wutthipong.info/images/geminiicon.png",
            iconUrl: `https://firebasestorage.googleapis.com/v0/b/patorsiangassistant.appspot.com/o/profile_icon%2Fchatgpt.png?alt=media&token=${process.env.CHATGPT_ICON_TOKEN}`,
          },
          text: msg,
        },
      ]);
      break;
    }
    default: {
      const notifyStatus = [
        ...((myCache.get("NotifyTheStaff") as Array<string>) ?? []),
      ];
      if (!notifyStatus.includes(userId)) {
        notifyStatus.push(userId);
        await line.notify({
          message:
              "มีผู้ใช้ชื่อ " +
              userData?.displayName +
              " ต้องการติดต่อ " +
              agent.query,
          imageFullsize: userData?.pictureUrl,
          imageThumbnail: userData?.pictureUrl,
        });
        agent.add("เราได้แจ้งเตือนไปยัง ภัทร แล้วค่ะ รอสักครู่นะคะ");
      }
      myCache.set("NotifyTheStaff", notifyStatus, 600);
      break;
    }
    }
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

  const mode = async () => {
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
                label: "Gemini",
                text: "ขอคุยกับ Gemini",
              },
            },
            {
              type: "action",
              action: {
                type: "message",
                label: "ChatGPT",
                text: "ขอคุยกับ ChatGPT",
              },
            },
            {
              type: "action",
              action: {
                type: "message",
                label: "Pat",
                text: "ขอคุยกับ Pat",
              },
            },
          ],
        },
      },
    ]);
  };

  const geminiMode = async (agent: WebhookClientType) => {
    logger.log("Change mode to Gemini");
    await firestore.updateUser("gemini", userData);
    agent.add(
      "คุณได้เปลี่ยนเป็นโหมดคุยกับ gemini แล้ว สามารถสอบถามต่อได้เลยค่ะ"
    );
  };

  const chatGPTMode = async (agent: WebhookClientType) => {
    logger.log("Change mode to ChatGPT");
    await firestore.updateUser("chatgpt", userData);
    agent.add(
      "คุณได้เปลี่ยนเป็นโหมดคุยกับ ChatGPT แล้ว สามารถสอบถามต่อได้เลยค่ะ"
    );
  };

  const patMode = async (agent: WebhookClientType) => {
    logger.log("Change mode to ญat");
    await firestore.updateUser("pat", userData);
    agent.add("คุณได้เปลี่ยนเป็นโหมดคุยกับ ภัทร แล้ว สามารถสอบถามต่อได้เลยค่ะ");
  };

  const intentMap = new Map();
  intentMap.set("Default Fallback Intent", fallback);
  intentMap.set("BMI - custom - yes", bodyMassIndex);
  intentMap.set("Mode", mode);
  intentMap.set("Mode - custom - Gemini", geminiMode);
  intentMap.set("Mode - custom - ChatGPT", chatGPTMode);
  intentMap.set("Mode - custom - Pat", patMode);
  agent.handleRequest(intentMap);
});
