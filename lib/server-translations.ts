import { cookies } from 'next/headers';

import { translations } from './translations';

export function getServerTranslation() {
  const cookieStore = cookies();
  const lang = cookieStore.get('language')?.value || 'sq';

  return (key: string): string => {
    const keys = key.split('.');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let value: any = translations[lang as keyof typeof translations];

    for (const k of keys) {
      value = value?.[k];
    }

    return (value as string) || key;
  };
}