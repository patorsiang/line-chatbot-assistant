import * as logger from "firebase-functions/logger";
import {type Request} from "firebase-functions/v2/https";

import axios, {AxiosRequestHeaders} from "axios";
import * as crypto from "crypto";

const host = "dialogflow.cloud.google.com";
const url = `https://${host}/v1/integrations/line/webhook/${process.env.DIALOGFLOW_KEY}`;

export const postToDialogflow = async (request: Request) => {
  logger.log("Dialogflow");
  try {
    logger.log(
      await axios.post(url, JSON.stringify(request.body), {
        headers: {
          ...(request.headers as unknown as AxiosRequestHeaders),
          host,
        },
      })
    );
  } catch (error) {
    logger.error(error);
  }
};

export const createLineTextEvent = (
  originalRequest: Request,
  originalEvent: {
    replyToken: string;
    source: string;
    timestamp: number;
    mode: string;
  },
  text: string
) => {
  return {
    events: [
      {
        type: "message",
        replyToken: originalEvent.replyToken,
        source: originalEvent.source,
        timestamp: originalEvent.timestamp,
        mode: originalEvent.mode,
        message: {
          type: "text",
          text,
        },
      },
    ],
    destination: originalRequest?.body.destination,
  };
};

const calculateLineSignature = (body: string) => {
  const signature = crypto
    .createHmac("SHA256", process.env.CHANNEL_ACCESS_TOKEN ?? "")
    .update(body)
    .digest("base64");
  return signature;
};

export const convertToDialogflow = async (
  req: Request,
  body: {
    events: Array<{
      type: string;
      replyToken: string;
      source: string;
      timestamp: number;
      mode: string;
      message: {
        type: string;
        text: string;
      };
    }>;
    destination: string;
  }
) => {
  logger.log("Dialogflow: Converting to dialogflow");
  const jsonBody = JSON.stringify(body);
  req.headers.host = host;
  req.headers["x-line-signature"] = calculateLineSignature(jsonBody);
  req.headers["content-length"] = `${jsonBody.length}`;
  try {
    logger.log(
      await axios.post(url, jsonBody, {
        headers: {
          ...(req.headers as unknown as AxiosRequestHeaders),
        },
      })
    );
  } catch (error) {
    logger.error(error);
  }
};
