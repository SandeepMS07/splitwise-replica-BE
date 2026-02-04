export const metadata = {
  title: "SettleUp — Expense Splitter",
  description:
    "A free alternative to Splitwise. Split group expenses with friends, trips, and roommates. No ads. No payments. Free forever."
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
