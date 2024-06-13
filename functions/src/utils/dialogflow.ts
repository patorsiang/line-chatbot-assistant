import * as logger from "firebase-functions/logger";

import axios, {AxiosRequestHeaders} from "axios";

export const postToDialogflow = async (request: Request) => {
  logger.log("Dialogflow");
  const host = "dialogflow.cloud.google.com";
  try {
    await axios.post(
      `https://${host}/v1/integrations/line/webhook/${process.env.DIALOGFLOW_KEY}`,
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
