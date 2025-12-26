import { datadogRum } from '@datadog/browser-rum';

export function initRUM() {
  datadogRum.init({
    applicationId: process.env.VITE_DD_APP_ID!,
    clientToken: process.env.VITE_DD_CLIENT_TOKEN!,
    site: 'datadoghq.com',
    service: 'hello',
    env: process.env.NODE_ENV,
    version: process.env.VITE_APP_VERSION,
    sessionSampleRate: 100,
    premiumSampleRate: 100,
    trackUserInteractions: true,
    defaultPrivacyLevel: 'mask-user-input',
    allowedTracingUrls: [
      'https://api.hello.app',
      /https:\/\/.*\.hello\.app/
    ],
  });

  datadogRum.startSessionReplayRecording();
}

export const RUMMetrics = {
  trackPageLoad: (route: string, duration: number) => {
    datadogRum.addTiming('page_load', duration);
    datadogRum.addAction('page_view', { route });
  },

  trackUserAction: (action: string, target: string) => {
    datadogRum.addAction(action, { target });
  },

  trackAPICall: (endpoint: string, duration: number, status: number) => {
    datadogRum.addTiming(`api_${endpoint}`, duration);
    if (status >= 400) {
      datadogRum.addError(new Error(`API Error: ${endpoint}`), {
        endpoint,
        status,
      });
    }
  },
};
