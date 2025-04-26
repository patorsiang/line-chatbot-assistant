import { BitlyClient } from "bitly";

import { type WebhookClient as WebhookClientType } from "dialogflow-fulfillment";

const bitly = new BitlyClient(process.env.BITLY_API_TOKEN ?? "", {});

export const shortenUrl = (agent: WebhookClientType) => {
  const url = agent.parameters.url;
  return bitly.shorten(url).then((response: { url: string }) => {
    agent.add(`Shorten URL: ${response.url}`);
  });
};
