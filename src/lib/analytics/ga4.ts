import ReactGA from 'react-ga4';

export function initGA4() {
  ReactGA.initialize(process.env.VITE_GA4_ID!);
}

export const Analytics = {
  pageView: (path: string) => {
    ReactGA.send({ hitType: 'pageview', page: path });
  },

  event: (category: string, action: string, label?: string, value?: number) => {
    ReactGA.event({ category, action, label, value });
  },

  timing: (category: string, variable: string, value: number) => {
    ReactGA.send({ hitType: 'timing', timingCategory: category, timingVar: variable, timingValue: value });
  },
};
