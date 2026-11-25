import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { StoreProvider } from "@/store/StoreProvider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "VaultEdge — Next-Gen Digital Banking Management System",
  description:
    "Experience a smarter way to manage your accounts, transfer funds, monitor transactions, and stay in control of your financial activities in one secure platform.",
};

const themeInitScript = `
(function() {
  try {
    var stored = localStorage.getItem('vaultedge-theme');
    var theme = (stored === 'light' || stored === 'dark') ? stored : 'dark';
    var root = document.documentElement;
    root.setAttribute('data-theme', theme);
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
  } catch (e) {
    document.documentElement.setAttribute('data-theme', 'dark');
    document.documentElement.classList.add('dark');
  }
})();
`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      data-theme="dark"
      data-scroll-behavior="smooth"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} dark h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="min-h-full flex flex-col bg-background text-text-primary selection:bg-accent-subtle selection:text-accent">
        <StoreProvider>{children}</StoreProvider>
      </body>
    </html>
  );
}
