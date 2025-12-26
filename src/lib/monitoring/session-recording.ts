import Hotjar from '@hotjar/browser';

export function initSessionRecording() {
  if (process.env.NODE_ENV !== 'production') return;

  Hotjar.init(
    parseInt(process.env.VITE_HOTJAR_ID!),
    parseInt(process.env.VITE_HOTJAR_VERSION!)
  );
}

export const SessionTracking = {
  identify: (userId: string, attributes?: Record<string, any>) => {
    Hotjar.identify(userId, attributes);
  },

  tagRecording: (tags: string[]) => {
    tags.forEach(tag => Hotjar.event(tag));
  },

  trigger: (eventName: string) => {
    Hotjar.event(eventName);
  },
};
