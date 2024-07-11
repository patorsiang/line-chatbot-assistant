import {type WebhookClient as WebhookClientType} from "dialogflow-fulfillment";
import * as line from "../line";
import * as firestore from "../firestore";
import {logger} from "firebase-functions/v1";

export const registerFunction = async (
  agent: WebhookClientType,
  replyToken: string,
  userId: string
) => {
  const {name, latitude, longitude, selectedDate, stickerKeywords} =
    agent.parameters;
  const doc = {
    uid: userId,
    name,
    latitude,
    longitude,
    selected_date: Date.parse(selectedDate),
    sticker_keywords: stickerKeywords,
  };
  await firestore.updateMember(userId, doc);

  const msg = {
    type: "flex",
    altText: "Flex Message",
    contents: {
      type: "bubble",
      direction: "ltr",
      header: {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "text",
            text: "ขอบคุณสำหรับการลงทะเบียน",
            weight: "bold",
            size: "lg",
            align: "start",
            contents: [],
          },
          {
            type: "text",
            text: "ข้อมูลของคุณคือ",
            contents: [],
          },
        ],
      },
      body: {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "box",
            layout: "horizontal",
            contents: [
              {
                type: "text",
                text: "ชื่อ",
                weight: "bold",
                align: "start",
                contents: [],
              },
              {
                type: "text",
                text: `${name}`,
                align: "start",
                wrap: true,
                contents: [],
              },
            ],
          },
          {
            type: "box",
            layout: "horizontal",
            contents: [
              {
                type: "text",
                text: "ตำแหน่ง",
                weight: "bold",
                align: "start",
                contents: [],
              },
              {
                type: "text",
                text: `${latitude}, ${longitude}`,
                wrap: true,
                contents: [],
              },
            ],
          },
          {
            type: "box",
            layout: "horizontal",
            contents: [
              {
                type: "text",
                text: "วันที่",
                weight: "bold",
                contents: [],
              },
              {
                type: "text",
                text: `${selectedDate}`,
                wrap: true,
                contents: [],
              },
            ],
          },
          {
            type: "box",
            layout: "horizontal",
            contents: [
              {
                type: "text",
                text: "ความรู้สึก",
                weight: "bold",
                contents: [],
              },
              {
                type: "text",
                text: `${stickerKeywords}`,
                wrap: true,
                contents: [],
              },
            ],
          },
        ],
      },
    },
  };

  logger.log(msg);

  try {
    // error: can find LINE
    // const payload = new Payload(Platforms.LINE ?? "LINE", msg, {
    //   sendAsMessage: true,
    //   rawPayload: false,
    // });
    // agent.add(payload);
    await line.reply(replyToken, [msg]);
  } catch (error) {
    logger.error(error);
    agent.add("บันทึกข้อมูลสำเร็จแล้ว");
  }
};
