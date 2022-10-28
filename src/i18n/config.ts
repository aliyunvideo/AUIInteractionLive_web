import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { splitSearch } from '@/utils';

import translation_en from './en.json';
import translation_zh from './zh.json';

let lng = 'zh';
const search = window.location.search || window.location.hash;
const query = splitSearch(search);
if (query.lang && query.lang !== 'zh') {
  // 除了传入zh以外，其他都搞成en
  lng = 'en';
}

const resources = {
  en: {
    translation: translation_en,
  },
  zh: {
    translation: translation_zh,
  },
};

i18n.use(initReactI18next).init({
  resources,
  lng,
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;
