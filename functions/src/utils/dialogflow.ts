import * as logger from "firebase-functions/logger";

import axios, {AxiosRequestHeaders} from "axios";

export const postToDialogflow = async (request: Request) => {
  logger.log("Dialogflow");
  const host = "dialogflow.cloud.google.com";
  try {
    await axios.post(
      `https://${host}/v1/integrations/line/webhook/d396340f-7d5f-4af1-9f42-b4aec551c1f0`,
      JSON.stringify(request.body),
      {
        headers: {
          ...(request.headers as unknown as AxiosRequestHeaders),
          host,
        },
      }
    );
  } catch (error) {
    logger.error(error);
  }
};
