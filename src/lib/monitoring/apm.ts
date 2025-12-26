import { Datadog } from '@datadog/browser-rum';

export function initAPM() {
  Datadog.init({
    applicationId: process.env.VITE_DD_APP_ID!,
    clientToken: process.env.VITE_DD_CLIENT_TOKEN!,
    site: 'datadoghq.com',
    service: 'hello-frontend',
    env: process.env.NODE_ENV,
    version: process.env.VITE_APP_VERSION,
    sessionSampleRate: 100,
    sessionReplaySampleRate: 20,
    trackUserInteractions: true,
    trackResources: true,
    trackLongTasks: true,
    defaultPrivacyLevel: 'mask-user-input',
  });

  Datadog.startSessionReplayRecording();
}

export function trackPageView(route: string) {
  Datadog.addRumGlobalContext('route', route);
}

export function trackError(error: Error, context?: Record<string, any>) {
  Datadog.addError(error, context);
}

export function trackPerformance(metric: string, value: number) {
  Datadog.addTiming(metric, value);
}
