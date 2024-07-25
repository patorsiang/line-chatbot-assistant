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

import * as line from "./utils/line";
import * as gemini from "./utils/gemini";
import * as storage from "./utils/cloudstorage";
import * as firestore from "./utils/firestore";
import * as dialogflow from "./utils/dialogflow";
import {getCurrentGoldPrice} from "./utils/gold";
import * as sheet from "./utils/googlesheet";

import {
  shortenUrl,
  bodyMassIndex,
  modeFunc,
  geminiModeFunc,
  chatGPTModeFunc,
  patModeFunc,
  fallbackFunc,
  registerFunction,
} from "./utils/fullfilment";
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
        switch (event.message.type) {
        case "text":
          await dialogflow.postToDialogflow(req);
          break;

        case "image": {
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

        case "location": {
          logger.log("LOCATION:", JSON.stringify(event.message));
          const locationText = `LAT : ${event.message.latitude} , LNG : ${event.message.longitude}`;
          logger.debug("REPLY LOCATION: ", locationText);
          const locationMsg = dialogflow.createLineTextEvent(
            req,
            event,
            locationText
          );
          logger.debug("REPLY LOCATION MSG: ", JSON.stringify(locationMsg));
          await dialogflow.convertToDialogflow(req, locationMsg);
          break;
        }

        case "sticker": {
          logger.log("STICKER:", JSON.stringify(event.message));
          const keywordsText = `STICKER: ${event.message.keywords.toString()}`;
          logger.debug("REPLY STICKER: ", keywordsText);
          const keywordMsg = dialogflow.createLineTextEvent(
            req,
            event,
            keywordsText
          );
          logger.debug("REPLY STICKER MSG: ", JSON.stringify(keywordMsg));
          await dialogflow.convertToDialogflow(req, keywordMsg);
          break;
        }

        default:
          break;
        }
        break;

      case "postback": {
        const dateText = `DATE: ${event.postback.params.date}`;
        const dateMsg = dialogflow.createLineTextEvent(req, event, dateText);
        await dialogflow.convertToDialogflow(req, dateMsg);
        break;
      }
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
      line.goldBroadcast(priceCurrent);
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

  const fallback = async (agent: WebhookClientType) =>
    fallbackFunc({
      agent,
      userMode,
      replyToken,
      userId,
      userData,
    });

  const mode = async () => modeFunc({replyToken, userMode});
  const geminiMode = async (agent: WebhookClientType) =>
    geminiModeFunc(agent, userData);
  const chatGPTMode = async (agent: WebhookClientType) =>
    chatGPTModeFunc(agent, userData);
  const patMode = async (agent: WebhookClientType) =>
    patModeFunc(agent, userData);

  const register = async (agent: WebhookClientType) =>
    registerFunction(agent, replyToken, userId);

  const intentMap = new Map();
  intentMap.set("Default Fallback Intent", fallback);
  intentMap.set("BMI - custom - yes", bodyMassIndex);
  intentMap.set("Mode", mode);
  intentMap.set("Mode - custom - Gemini", geminiMode);
  intentMap.set("Mode - custom - ChatGPT", chatGPTMode);
  intentMap.set("Mode - custom - Pat", patMode);
  intentMap.set("Shorten URL", shortenUrl);
  intentMap.set("Register - sticker", register);
  agent.handleRequest(intentMap);
});

export const notifyFromGoogleSheet = pubsub
  .schedule("*/20 * * * *")
  .timeZone("Asia/Bangkok")
  .onRun(sheet.notifyFromGoogleSheetFunc);
