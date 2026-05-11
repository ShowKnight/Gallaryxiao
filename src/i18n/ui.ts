// All UI strings live here. Pages read the right language via t().
export const languages = {
  zh: '中文',
  en: 'English',
} as const;

export type Lang = keyof typeof languages;

export const defaultLang: Lang = 'zh';

export const ui = {
  zh: {
    'nav.works': '作品',
    'nav.journal': '日志',
    'nav.about': '关于',
    'nav.contact': '联系',
    'lang.switch': 'EN',
    'home.featured': '系列',
    'home.recent': '最近的日志',
    'home.viewAll': '查看全部',
    'works.title': '作品',
    'works.subtitle': '系列与故事',
    'series.intro': '序',
    'series.photos': '照片',
    'series.viewSeries': '进入系列',
    'photo.next': '下一张',
    'photo.prev': '上一张',
    'photo.backToSeries': '返回系列',
    'photo.location': '地点',
    'photo.date': '时间',
    'photo.camera': '相机',
    'photo.film': '胶片',
    'journal.title': '日志',
    'journal.subtitle': '图像日记',
    'journal.empty': '还没有日志。',
    'about.title': '关于',
    'contact.title': '联系',
    'contact.commission.title': '关于约拍',
    'footer.copyright': '版权所有',
    'meta.ongoing': '至今',
  },
  en: {
    'nav.works': 'Works',
    'nav.journal': 'Journal',
    'nav.about': 'About',
    'nav.contact': 'Contact',
    'lang.switch': '中',
    'home.featured': 'Series',
    'home.recent': 'Recent Journal',
    'home.viewAll': 'View all',
    'works.title': 'Works',
    'works.subtitle': 'Series & stories',
    'series.intro': 'Foreword',
    'series.photos': 'Photographs',
    'series.viewSeries': 'Enter series',
    'photo.next': 'Next',
    'photo.prev': 'Previous',
    'photo.backToSeries': 'Back to series',
    'photo.location': 'Location',
    'photo.date': 'Date',
    'photo.camera': 'Camera',
    'photo.film': 'Film',
    'journal.title': 'Journal',
    'journal.subtitle': 'Image diary',
    'journal.empty': 'No entries yet.',
    'about.title': 'About',
    'contact.title': 'Contact',
    'contact.commission.title': 'On commissions',
    'footer.copyright': 'All rights reserved',
    'meta.ongoing': 'present',
  },
} as const;

export type UiKey = keyof (typeof ui)['zh'];

export function useTranslations(lang: Lang) {
  return function t(key: UiKey): string {
    return ui[lang][key] ?? ui[defaultLang][key];
  };
}

export function getLangFromUrl(url: URL): Lang {
  const [, maybeLang] = url.pathname.split('/');
  if (maybeLang in ui) return maybeLang as Lang;
  return defaultLang;
}

export function pathFor(lang: Lang, path: string): string {
  const clean = path.startsWith('/') ? path : `/${path}`;
  return lang === defaultLang ? clean : `/${lang}${clean}`;
}

// pick the localized field from a content entry (e.g. title_zh / title_en)
export function pick<T extends Record<string, unknown>>(
  data: T,
  base: string,
  lang: Lang,
): string {
  const key = `${base}_${lang}` as keyof T;
  const fallback = `${base}_${defaultLang}` as keyof T;
  const v = (data[key] ?? data[fallback]) as string | undefined;
  return v ?? '';
}
