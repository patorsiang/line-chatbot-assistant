import * as logger from "firebase-functions/logger";
import axios from "axios";
import * as qs from "qs";

import {
  LINE_HEADER,
  LINE_NOTIFY_HEADER,
  LINE_MESSAGING_API,
  LINE_CONTENT_API,
} from "./contrants";

type LINE_MESSAGING_PAYLOAD_TYPE = Array<{
  type: string;
  text?: string;
  sender?: { name?: string; iconUrl?: string };
  quickReply?: {
    items: Array<{
      type: string;
      action: {
        type: string;
        label: string;
        text: string;
      };
    }>;
  };
}>;

type LINE_NOTIFY_PAYLOAD = {
  message: string;
  imageFullsize: string;
  imageThumbnail: string;
};

export const getImageBinary = async (messageId: string) => {
  const originalImage = await axios({
    method: "get",
    headers: LINE_HEADER,
    url: `${LINE_CONTENT_API}/${messageId}/content`,
    responseType: "arraybuffer",
  });
  return originalImage.data;
};

export const reply = (token: string, payload: LINE_MESSAGING_PAYLOAD_TYPE) => {
  return axios({
    method: "post",
    url: `${LINE_MESSAGING_API}/message/reply`,
    headers: LINE_HEADER,
    data: {replyToken: token, messages: payload},
  });
};

export const goldBroadcast = (priceCurrent: string) => {
  const prices = priceCurrent.split("|");
  return axios({
    method: "post",
    url: `${LINE_MESSAGING_API}/message/broadcast`,
    headers: LINE_HEADER,
    data: JSON.stringify({
      messages: [
        {
          type: "flex",
          altText: "Flex Message",
          contents: {
            type: "bubble",
            size: "giga",
            body: {
              type: "box",
              layout: "vertical",
              paddingAll: "8%",
              backgroundColor: "#FFF9E2",
              contents: [
                {
                  type: "text",
                  text: "ราคาทองคำ",
                  weight: "bold",
                  size: "xl",
                  align: "center",
                },
                {
                  type: "box",
                  layout: "vertical",
                  margin: "xxl",
                  spacing: "sm",
                  contents: [
                    {
                      type: "box",
                      layout: "baseline",
                      spacing: "sm",
                      contents: [
                        {
                          type: "text",
                          text: "ราคารับซื้อ",
                          wrap: true,
                          color: "#E2C05B",
                          flex: 5,
                          align: "end",
                        },
                        {
                          type: "text",
                          text: "ราคาขาย",
                          flex: 2,
                          color: "#E2C05B",
                          align: "end",
                        },
                      ],
                    },
                    {
                      type: "box",
                      layout: "baseline",
                      spacing: "sm",
                      contents: [
                        {
                          type: "text",
                          text: "ทองคำแท่ง",
                          flex: 3,
                        },
                        {
                          type: "text",
                          text: prices[0],
                          wrap: true,
                          size: "sm",
                          flex: 2,
                          align: "end",
                        },
                        {
                          type: "text",
                          text: prices[1],
                          flex: 2,
                          size: "sm",
                          align: "end",
                        },
                      ],
                    },
                    {
                      type: "separator",
                    },
                    {
                      type: "box",
                      layout: "baseline",
                      spacing: "sm",
                      contents: [
                        {
                          type: "text",
                          text: "ทองรูปพรรณ",
                          flex: 3,
                        },
                        {
                          type: "text",
                          text: prices[2],
                          wrap: true,
                          size: "sm",
                          flex: 2,
                          align: "end",
                        },
                        {
                          type: "text",
                          text: prices[3],
                          flex: 2,
                          size: "sm",
                          align: "end",
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          },
        },
      ],
    }),
  });
};

export const replyResizeImg = (
  token: string,
  msg: string,
  image: { original: string; thumb: string }
) => {
  return axios({
    method: "post",
    url: `${LINE_MESSAGING_API}/message/reply`,
    headers: LINE_HEADER,
    data: {
      replyToken: token,
      messages: [
        {type: "text", text: msg},
        {
          type: "flex",
          altText: "Flex Message",
          contents: {
            type: "bubble",
            hero: {
              type: "image",
              url: image.original,
              size: "full",
              aspectRatio: "1:1",
              aspectMode: "cover",
            },
            footer: {
              type: "box",
              layout: "horizontal",
              spacing: "md",
              contents: [
                {
                  type: "button",
                  action: {
                    type: "uri",
                    label: "Original",
                    uri: image.original,
                  },
                  style: "secondary",
                },
              ],
            },
          },
        },
      ],
    },
  });
};

export const getUserProfile = (userId: string) => {
  return axios({
    method: "get",
    url: "https://api.line.me/v2/bot/profile/" + userId,
    headers: LINE_HEADER,
  });
};

export const notify = (payload: LINE_NOTIFY_PAYLOAD) => {
  return axios({
    method: "post",
    url: "https://notify-api.line.me/api/notify",
    headers: LINE_NOTIFY_HEADER,
    data: qs.stringify(payload),
  });
};

export const loading = async (userId: string) => {
  try {
    const response = await axios({
      method: "post",
      url: "https://api.line.me/v2/bot/chat/loading/start",
      headers: LINE_HEADER,
      data: {chatId: userId, loadingSeconds: 30},
    });
    logger.log(response);
    return response;
  } catch (error) {
    logger.error(error);
    // Handle the error or rethrow it if needed
    throw error;
  }
};

export const gbpthbBroadcast = (rate: Array<string>) => {
  return axios({
    method: "post",
    url: `${LINE_MESSAGING_API}/message/broadcast`,
    headers: LINE_HEADER,
    data: JSON.stringify({
      messages: [
        {
          type: "flex",
          altText: "Flex Message",
          contents: {
            type: "bubble",
            size: "giga",
            body: {
              type: "box",
              layout: "vertical",
              paddingAll: "8%",
              backgroundColor: "#000040",
              contents: [
                {
                  type: "text",
                  text: "GBP - THB",
                  weight: "bold",
                  size: "xl",
                  align: "center",
                  color: "#FAF9F6",
                },
                {
                  type: "box",
                  layout: "baseline",
                  spacing: "sm",
                  contents: [
                    {
                      type: "text",
                      text: "avg ของคุณ",
                      wrap: true,
                      color: "#FAF9F6",
                      flex: 1,
                      align: "center",
                    },
                    {
                      type: "text",
                      text: "rate ปัจจุบัน",
                      flex: 1,
                      color: "#FAF9F6",
                      align: "center",
                    },
                  ],
                },
                {
                  type: "separator",
                },
                {
                  type: "box",
                  layout: "vertical",
                  margin: "xxl",
                  spacing: "sm",
                  contents: [
                    {
                      type: "box",
                      layout: "baseline",
                      spacing: "sm",
                      contents: [
                        {
                          type: "text",
                          text: rate[0],
                          wrap: true,
                          size: "sm",
                          flex: 1,
                          color: "#FFFFFF",
                          align: "center",
                        },
                        {
                          type: "text",
                          text: rate[1],
                          flex: 1,
                          size: "sm",
                          color: "#FFFFFF",
                          align: "center",
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          },
        },
      ],
    }),
  });
};
