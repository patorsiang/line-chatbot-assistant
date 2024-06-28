import {type WebhookClient as WebhookClientType} from "dialogflow-fulfillment";

export const bodyMassIndex = (agent: WebhookClientType) => {
  const weight = agent.parameters.weight as unknown as number;
  const height = (agent.parameters.height as unknown as number) / 100;
  const bmi = Number((weight / (height * height)).toFixed(2));
  let result = "ขออภัย หนูไม่เข้าใจ";

  if (bmi < 18.5) {
    result = "คุณผอมไป กินข้าวบ้างนะ";
  } else if (bmi >= 18.5 && bmi <= 22.9) {
    result = "คุณหุ่นดีจุงเบย";
  } else if (bmi >= 23 && bmi <= 24.9) {
    result = "คุณเริ่มจะท้วมแล้วนะ";
  } else if (bmi >= 25.8 && bmi <= 29.9) {
    result = "คุณอ้วนละ ออกกำลังกายหน่อยนะ";
  } else if (bmi > 30) {
    result = "คุณอ้วนเกินไปละ หาหมอเหอะ";
  }
  agent.add(result);
};
