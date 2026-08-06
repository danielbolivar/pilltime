import { useEffect } from 'react';

import { applyLanguage, t } from '@/src/i18n';
import { usePillStore } from '@/src/store/pillStore';

/** Subscribe to language so screens re-render when it changes. */
export function useT() {
  const language = usePillStore((s) => s.settings.language);
  useEffect(() => {
    applyLanguage(language);
  }, [language]);
  return t;
}
