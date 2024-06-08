import axios from "axios";

import {LINE_HEADER, LINE_MESSAGING_API, LINE_CONTENT_API} from "./contrants";

export const getImageBinary = async (messageId: string) => {
  const originalImage = await axios({
    method: "get",
    headers: LINE_HEADER,
    url: `${LINE_CONTENT_API}/${messageId}/content`,
    responseType: "arraybuffer",
  });
  return originalImage.data;
};

export const reply = (
  token: string,
  payload: Array<{
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
  }>
) => {
  return axios({
    method: "post",
    url: `${LINE_MESSAGING_API}/message/reply`,
    headers: LINE_HEADER,
    data: {replyToken: token, messages: payload},
  });
};

export const broadcast = (priceCurrent: string) => {
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
