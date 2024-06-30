export const trackMainPayload = (postCode: string, trackItems: string) => ({
  type: "flex",
  altText: "สถานะการส่งของ",
  contents: {
    type: "bubble",
    size: "giga",
    body: {
      type: "box",
      layout: "vertical",
      contents: [
        {
          type: "text",
          text: `${postCode}`,
          decoration: "none",
          size: "xl",
          weight: "bold",
        },
        {
          type: "box",
          layout: "vertical",
          contents: trackItems,
          spacing: "sm",
          margin: "md",
        },
      ],
    },
  },
});

export const trackMainItem = (
  detail: {
    status_date: string;
    status_description: string;
    location: string;
    postcode: string;
  },
  bgcolor: string
) => ({
  type: "box",
  layout: "horizontal",
  contents: [
    {
      type: "box",
      layout: "vertical",
      contents: [
        {
          type: "box",
          layout: "horizontal",
          contents: [
            {
              type: "text",
              text: `${detail.status_date}`,
            },
          ],
        },
        {
          type: "box",
          layout: "horizontal",
          contents: [
            {
              type: "text",
              text: `${detail.status_description}`,
              size: "sm",
            },
          ],
          spacing: "none",
          margin: "md",
        },
        {
          type: "box",
          layout: "horizontal",
          contents: [
            {
              type: "text",
              text: `${detail.location}`,
              size: "sm",
            },
            {
              type: "text",
              text: `${detail.postcode}`,
              size: "sm",
            },
          ],
          spacing: "none",
          margin: "md",
        },
      ],
    },
  ],
  backgroundColor: `${bgcolor}`,
  cornerRadius: "md",
  paddingAll: "10px",
});

exports.trackNotFound = () => ({
  type: "text",
  text: "ไม่พบหมายเลขพัสดุที่ระบุ",
});
