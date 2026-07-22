'use client';

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import enCommon from '../locales/en/common.json';
import esCommon from '../locales/es/common.json';
import frCommon from '../locales/fr/common.json';
import deCommon from '../locales/de/common.json';

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { common: enCommon },
      es: { common: esCommon },
      fr: { common: frCommon },
      de: { common: deCommon }
    },
    defaultNS: 'common',
    lng: 'en', // default language
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false // react already safes from xss
    }
  });

export default i18n;
