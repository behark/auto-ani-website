import { cookies } from 'next/headers';
import { translations } from './translations';

export function getServerTranslation() {
  const cookieStore = cookies();
  const lang = cookieStore.get('language')?.value || 'sq';

  return (key: string) => {
    const keys = key.split('.');
    let value: any = translations[lang as keyof typeof translations];

    for (const k of keys) {
      value = value?.[k];
    }

    return value || key;
  };
}