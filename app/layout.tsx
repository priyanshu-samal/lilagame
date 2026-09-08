import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "LILA BLACK — Player Journey Explorer",
  description: "Level Designer Analytics & Replay Tool for LILA BLACK production telemetry. Visualize player journeys, heatmaps, and match replays.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <body className="h-full w-full overflow-hidden">{children}</body>
    </html>
  );
}
