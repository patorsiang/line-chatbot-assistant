import {
  GoogleGenerativeAI,
  HarmBlockThreshold,
  HarmCategory,
} from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.API_KEY ?? "");

const safetySettings = [
  {
    category: HarmCategory.HARM_CATEGORY_HARASSMENT,
    threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
  },
  {
    category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
    threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
  },
  {
    category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
    threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
  },
  {
    category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
    threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
  },
];

export const textOnly = async (prompt: string) => {
  // For text-only input, use the gemini-pro model
  const model = genAI.getGenerativeModel({
    model: "gemini-pro",
    safetySettings,
  });
  const result = await model.generateContent(prompt);
  return result.response.text();
};

export const modalForReceipt = async (imageBinary: string) => {
  // For text-and-image input (multimodal), use the gemini-pro-vision model
  const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash-lite",
    safetySettings,
  });
  const prompt = `help me to extract the text from this image into JSON format.
  e.g. {
    "notification_type": "",
    "transaction_type": "",
    "amount": "",
    "card_used": "",
    "merchant": "",
    "available_balance": "",
    "transaction_timestamp": ""
  }`;
  const mimeType = "image/png";

  // Convert image binary to a GoogleGenerativeAI.Part object.
  const imageParts = [
    {
      inlineData: {
        data: Buffer.from(imageBinary, "binary").toString("base64"),
        mimeType,
      },
    },
  ];

  const result = await model.generateContent([prompt, ...imageParts]);
  const text = result.response.text();
  return text;
};

const specialize = ["รายรับ-รายจ่าย"];

export const chat = async (prompt: string) => {
  // For text-only input, use the gemini-pro model
  const model = genAI.getGenerativeModel({
    model: "gemini-pro",
    safetySettings,
  });
  const chat = model.startChat({
    history: [
      {
        role: "user",
        parts: [{ text: "สวัสดีจ้า" }],
      },
      {
        role: "model",
        parts: [
          {
            text: `สวัสดีค เราภัทรนะ จะมาเป็นผู้ช่วยเกี่ยวกับ ${specialize.join(
              ","
            )}`,
          },
        ],
      },
    ],
  });

  const result = await chat.sendMessage(prompt);
  return result.response.text();
};
