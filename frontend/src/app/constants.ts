export const siteConfig = {
  name: "HolyMon",
  url: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:4000",
  description:
    "HolyMon - Persuade. Devote. Conquer. A game of persuasion where your sacred agents rise through devotion and influence.",
  ogImage: "/og.png",
  creator: "HolyMon",
  icons: [
    {
      rel: "icon",
      type: "image/png",
      url: "/favicon.png",
      media: "(prefers-color-scheme: light)",
    },
    {
      rel: "icon",
      type: "image/png",
      url: "/favicon.png",
      media: "(prefers-color-scheme: dark)",
    },
  ],
};
