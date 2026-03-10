export type LocaleString = {
  en: string;
  zh: string;
};

export type Film = {
  id: string;
  title: LocaleString;
  director: string;
  section: string;
  posterUrl: string;
  country?: string;
  year?: number;
  runtime?: number;
  synopsis?: LocaleString;
  language?: string;
  subtitles?: string[];
  imdbId?: string;
  letterboxdSlug?: string;
};

export type Screening = {
  id: string;
  filmId: string;
  filmTitle?: LocaleString;
  date: string; // ISO 8601: YYYY-MM-DD
  time: string; // HH:MM 24h
  venueId: string;
  screeningCode: string;
  ticketUrl: string;
  guestAttend?: boolean;
};

export type Venue = {
  id: string;
  code: string;
  name: LocaleString;
  address: LocaleString;
};

export type Section = {
  id: string;
  label: LocaleString;
  description: LocaleString;
};
