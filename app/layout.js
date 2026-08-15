import "./globals.css";

export const metadata = {
  title: "差旅小幫手 | 大新科技",
  description: "依據《員工差旅管理辦法》與《差旅常見問題FAQ》回答的內部差旅問答機器人",
};

export default function RootLayout({ children }) {
  return (
    <html lang="zh-Hant">
      <body>{children}</body>
    </html>
  );
}
