export const LINE_MESSAGING_API = "https://api.line.me/v2/bot";
export const LINE_CONTENT_API = "https://api-data.line.me/v2/bot/message";

export const LINE_HEADER = {
  "Content-Type": "application/json",
  "Authorization": `Bearer ${process.env.CHANNEL_ACCESS_TOKEN}`,
};
