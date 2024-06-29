import {type WebhookClient as WebhookClientType} from "dialogflow-fulfillment";

import * as firestore from "../firestore";

export const registerFunction = async (
  agent: WebhookClientType,
  userId: string
) => {
  const {name, latitude, longitude, selectedDate} = agent.parameters;
  const doc = {
    uid: userId,
    name,
    latitude,
    longitude,
    selected_date: Date.parse(selectedDate),
  };
  await firestore.updateMember(userId, doc);
  agent.add("บันทึกข้อมูลสำเร็จแล้ว");
};
