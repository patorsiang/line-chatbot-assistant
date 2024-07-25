/* eslint-disable max-len */

import * as logger from "firebase-functions/logger";
import NodeCache from "node-cache";
const myCache = new NodeCache();

import {type WebhookClient as WebhookClientType} from "dialogflow-fulfillment";

import * as openai from "../openai";
import * as gemini from "../gemini";
import * as line from "../line";

export const fallbackFunc = async ({
  agent,
  userMode,
  replyToken,
  userId,
  userData,
}: {
  agent: WebhookClientType;
  userMode: string;
  replyToken: string;
  userId: string;
  userData?: FirebaseFirestore.DocumentData;
}) => {
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
