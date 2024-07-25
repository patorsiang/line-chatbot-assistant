import {google} from "googleapis";

import * as line from "../line";

import serviceAccount from "./service-account.json";
import {logger} from "firebase-functions/v1";

const sheets = google.sheets("v4");

const GOOGLE_SHEET_ID = process.env.GOOGLE_SHEET_ID1;

const jwtClient = new google.auth.JWT({
  email: serviceAccount.client_email,
  key: serviceAccount.private_key,
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});

export const notifyFromGoogleSheetFunc = async () => {
  const check = await sheets.spreadsheets.values.get({
    auth: jwtClient,
    spreadsheetId: GOOGLE_SHEET_ID,
    range: "Exchange pre departure !E4",
  });
  const avgs = await sheets.spreadsheets.values.get({
    auth: jwtClient,
    spreadsheetId: GOOGLE_SHEET_ID,
    range: "Exchange pre departure !E3:F3",
  });

  const checkValue = check.data.values?.[0];
  const currentAvg = avgs.data.values?.[0]?.[0];
  const current = avgs.data.values?.[0]?.[1];

  logger.debug("Average GBPTHB: " + checkValue, currentAvg, current);

  if (checkValue && Number(checkValue) > 0 && current && currentAvg) {
    line.gbpthbBroadcast([currentAvg, current]);
  }
};
