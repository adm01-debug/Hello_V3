export const CustomEvents = {
  callStarted: (callId: string, contactId: string) => {
    Analytics.event('Call', 'Started', callId);
  },

  callCompleted: (callId: string, duration: number) => {
    Analytics.event('Call', 'Completed', callId, duration);
    Analytics.timing('Call', 'Duration', duration);
  },

  contactCreated: (contactId: string) => {
    Analytics.event('Contact', 'Created', contactId);
  },

  searchPerformed: (query: string, results: number) => {
    Analytics.event('Search', 'Performed', query, results);
  },
};
