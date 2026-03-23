import "./globals.css";

export const metadata = {
  title: "Statio",
  description: "Real-time website and API monitoring dashboard"
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
