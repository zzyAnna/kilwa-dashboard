import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Scraper Monitor | Kilwa Dashboard',
};

export default function ScraperLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
