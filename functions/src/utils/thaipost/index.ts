import * as logger from "firebase-functions/logger";
import axios from "axios";

import {THAIPOST_API_HEADER} from "../contrants";

export const getAuthToken = async () => {
  try {
    const response = await axios({
      url: "https://trackapi.thailandpost.co.th/post/api/v1/authenticate/token",
      method: "POST",
      headers: THAIPOST_API_HEADER,
    });

    logger.log("Token is ready!");
    return response.data;
  } catch (error) {
    logger.error(error);
    return "";
  }
};

export const getItemTrack = async (trackNo: string) => {
  try {
    const authToken = await getAuthToken();
    const params = {
      status: "all",
      language: "TH",
      barcode: [trackNo],
    };
    const response = await axios({
      url: "https://trackapi.thailandpost.co.th/post/api/v1/track",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Token " + (authToken?.token as string),
      },
      data: params,
    });
    return response.data;
  } catch (error) {
    logger.error(error);
    return []; // return an empty array if error occurred
  }
};
