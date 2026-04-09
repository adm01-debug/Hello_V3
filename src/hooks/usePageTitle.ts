import { useEffect } from 'react';

const APP_NAME = 'VoIP Panel';

/**
 * Sets the document title for SEO and browser tab UX.
 * @param title - Page-specific title (e.g. "Dashboard")
 */
export function usePageTitle(title: string) {
  useEffect(() => {
    document.title = `${title} | ${APP_NAME}`;
    return () => {
      document.title = APP_NAME;
    };
  }, [title]);
}
