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
import * as admin from "firebase-admin";
admin.initializeApp();

import * as line from "./utils/line";
import * as gemini from "./utils/gemini";
import * as storage from "./utils/cloudstorage";
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
      switch (event.type) {
      case "message":
        if (event.message.type === "text") {
          const msg = await gemini.chat(event.message.text);
          logger.log("REPLY TEXT: ", msg);
          await line.reply(event.replyToken, [{type: "text", text: msg}]);
          break;
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

    const priceLast = await admin.firestore().doc("line/gold").get();
    if (!priceLast.exists || priceLast.data()?.price !== priceCurrent) {
      await admin.firestore().doc("line/gold").set({price: priceCurrent});
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
    const replyToken =
      request.body.originalDetectIntentRequest.payload.data.replyToken;

    const question = "คุณต้องการสอบถามกับ Bot หรือ Staff";
    const answer1 = "สอบถามกับ Bot " + agent.query;
    const answer2 = "สอบถามกับ Staff " + agent.query;

    // await line.reply(
    //   replyToken,
    //   template.quickreply(question, answer1, answer2)
    // );
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

    agent.add("I didn't understand");
    agent.add("I'm sorry, can you try again?");
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
