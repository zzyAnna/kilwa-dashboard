import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sentiment Analysis | Kilwa Dashboard',
};

export default function SentimentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
