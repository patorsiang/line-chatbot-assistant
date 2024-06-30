export const LINE_MESSAGING_API = "https://api.line.me/v2/bot";
export const LINE_CONTENT_API = "https://api-data.line.me/v2/bot/message";

export const LINE_HEADER = {
  "Content-Type": "application/json",
  "Authorization": `Bearer ${process.env.CHANNEL_ACCESS_TOKEN}`,
};

export const LINE_NOTIFY_HEADER = {
  "Content-Type": "application/x-www-form-urlencoded",
  "Authorization": "Bearer " + process.env.NOTIFY_TOKEN,
};

export const THAIPOST_API_HEADER = {
  "Content-Type": "application/json",
  "Authorization": "Token " + process.env.THAIPOST_API_TOKEN ?? "",
};
