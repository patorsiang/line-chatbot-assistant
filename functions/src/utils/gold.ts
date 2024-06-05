import axios from "axios";
import {load} from "cheerio";

export const getCurrentGoldPrice = async () => {
  const response = await axios.get("https://goldtraders.or.th/default.aspx");
  const html = response.data;
  const $ = load(html);
  const selector = $(
    "#DetailPlace_uc_goldprices1_GoldPricesUpdatePanel font[color]"
  );
  if (selector.length !== 4) {
    return null;
  }

  let priceCurrent = "";
  selector.each((index, element) => {
    if (index === 0) {
      priceCurrent = $(element).text();
    } else {
      priceCurrent = priceCurrent.concat("|", $(element).text());
    }
  });
  return priceCurrent;
};
