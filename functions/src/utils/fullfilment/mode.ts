import * as logger from "firebase-functions/logger";
import {type WebhookClient as WebhookClientType} from "dialogflow-fulfillment";

import * as line from "../line";
import * as firestore from "../firestore";

export const modeFunc = async ({
  replyToken,
  userMode,
}: {
  replyToken: string;
  userMode: string;
}) => {
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

export const geminiModeFunc = async (
  agent: WebhookClientType,
  userData?: FirebaseFirestore.DocumentData
) => {
  logger.log("Change mode to Gemini");
  await firestore.updateUser("gemini", userData);
  agent.add("คุณได้เปลี่ยนเป็นโหมดคุยกับ gemini แล้ว สามารถสอบถามต่อได้เลยค่ะ");
};

export const chatGPTModeFunc = async (
  agent: WebhookClientType,
  userData?: FirebaseFirestore.DocumentData
) => {
  logger.log("Change mode to ChatGPT");
  await firestore.updateUser("chatgpt", userData);
  agent.add(
    "คุณได้เปลี่ยนเป็นโหมดคุยกับ ChatGPT แล้ว สามารถสอบถามต่อได้เลยค่ะ"
  );
};

export const patModeFunc = async (
  agent: WebhookClientType,
  userData?: FirebaseFirestore.DocumentData
) => {
  logger.log("Change mode to ญat");
  await firestore.updateUser("pat", userData);
  agent.add("คุณได้เปลี่ยนเป็นโหมดคุยกับ ภัทร แล้ว สามารถสอบถามต่อได้เลยค่ะ");
};
