import * as logger from "firebase-functions/logger";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY ?? "",
});

export const chat = async (msg: string) => {
  const completion = await openai.chat.completions.create({
    model: "gpt-3.5-turbo",
    messages: [
      {
        role: "user",
        content: msg,
      },
    ],
  });
  logger.log(JSON.stringify(completion));
  return completion.choices[0].message.content ?? "";
};
