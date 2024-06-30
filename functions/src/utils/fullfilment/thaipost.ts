import {type WebhookClient as WebhookClientType} from "dialogflow-fulfillment";

import {getItemTrack} from "../thaipost/index";

export const thaipost = async (agent: WebhookClientType) => {
  const trackNumber = agent.parameters.trackNumber;
  const trackData = await getItemTrack(trackNumber);
  if (trackData.length === 0) {
    agent.add("ไม่พบข้อมูลการจัดส่งสินค้า");
  } else {
    const trackList = trackData.map((track) => {
      return `สถานะการจัดส่ง: ${track.status}\nรายละเอียด: ${track.description}`;
    });

    agent.add(trackList.join("\n"));
  }
};
