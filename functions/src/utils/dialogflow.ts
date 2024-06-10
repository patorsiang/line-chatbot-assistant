import * as logger from "firebase-functions/logger";

import axios, {AxiosRequestConfig} from "axios";

export const postToDialogflow = async (request: Request) => {
  logger.log("Dialogflow");
  const url = "dialogflow.cloud.google.com";
  try {
    const axiosConfig: AxiosRequestConfig = {
      ...request.headers,
      url,
    };

    await axios.post(
      `https://${url}/v1/integrations/line/webhook/d396340f-7d5f-4af1-9f42-b4aec551c1f0`,
      JSON.stringify(request.body),
      axiosConfig
    );
  } catch (error) {
    logger.error(error);
  }
};
