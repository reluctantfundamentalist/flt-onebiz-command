import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Flt OneBiz Command",
  description: "Leadership + BD workspace — airline account intelligence.",
};

// After a Vercel deploy, an already-open tab (or browser cache) holds HTML
// whose JS chunk hashes no longer exist — the page renders blank. On any
// chunk load failure, reload once to pick up the fresh deployment.
const CHUNK_RECOVERY_SCRIPT = `
(function () {
  try {
    var FLAG = "obiz_stale_chunks";
    var flagged = sessionStorage.getItem(FLAG);
    var recover = function () {
      if (flagged) return; // already reloaded once — don't loop
      sessionStorage.setItem(FLAG, "1");
      location.reload();
    };
    window.addEventListener("error", function (e) {
      var t = e.target;
      if (t && t.tagName === "SCRIPT" && t.src && t.src.indexOf("/_next/static/") !== -1) recover();
    }, true);
    window.addEventListener("unhandledrejection", function (e) {
      var msg = String((e.reason && (e.reason.message || e.reason)) || "");
      if (/chunk/i.test(msg) && /load|import/i.test(msg)) recover();
    });
    window.addEventListener("load", function () { sessionStorage.removeItem(FLAG); });
  } catch (err) {}
})();
`;

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full">
        <script dangerouslySetInnerHTML={{ __html: CHUNK_RECOVERY_SCRIPT }} />
        {children}
      </body>
    </html>
  );
}
