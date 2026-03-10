import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { DM_Sans } from "next/font/google";
import { routing } from "@/i18n/routing";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { PlanProvider } from "@/components/PlanContext";
import { FavouritesProvider } from "@/components/FavouritesContext";
import "../globals.css";

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return locale === "zh"
    ? {
        title: "香港國際電影節 選片及排片小幫手",
        description: "第五十屆香港國際電影節。瀏覽電影、放映場次及完整節目表。",
      }
    : {
        title: "HKIFF 50 — Film Selection and Scheduler",
        description: "The 50th Hong Kong International Film Festival. Browse films, screenings, and the full schedule.",
      };
}

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params;

  if (!routing.locales.includes(locale as "en" | "zh")) {
    notFound();
  }

  setRequestLocale(locale);

  const messages = await getMessages();

  return (
    <html lang={locale} className={dmSans.variable}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className={`${dmSans.className} flex flex-col min-h-screen`}>
        <NextIntlClientProvider messages={messages}>
          <PlanProvider>
            <FavouritesProvider>
              <Header />
              <main className="flex-1">{children}</main>
              <Footer />
            </FavouritesProvider>
          </PlanProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
