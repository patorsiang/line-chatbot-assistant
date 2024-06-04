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

// for accessing the db connection
import * as admin from "firebase-admin";
admin.initializeApp();

// for network requests
import axios from "axios";

// for web scraping requests
import {load} from "cheerio";

import * as line from "./utils/line";
import * as gemini from "./utils/gemini";
import * as storage from "./utils/cloudstorage";
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
    const response = await axios.get("https://goldtraders.or.th/default.aspx");
    const html = response.data;
    const $ = load(html);
    const selector = $(
      "#DetailPlace_uc_goldprices1_GoldPricesUpdatePanel font[color]"
    );
    if (selector.length !== 4) {
      return null;
    }

    let priceCurrent = "";
    selector.each((index, element) => {
      if (index === 0) {
        priceCurrent = $(element).text();
      } else {
        priceCurrent = priceCurrent.concat("|", $(element).text());
      }
    });

    logger.log(priceCurrent);

    const priceLast = await admin.firestore().doc("line/gold").get();
    if (!priceLast.exists || priceLast.data()?.price !== priceCurrent) {
      await admin.firestore().doc("line/gold").set({price: priceCurrent});
      line.broadcast(priceCurrent);
      logger.log("BROADCAST:", priceCurrent);
    }

    return null; // Add this line to ensure all code paths return a value
  });
