export interface AnalyticsEvent {
  name: string;
  properties?: Record<string, any>;
  timestamp?: number;
}

export interface UserProperties {
  id?: string;
  email?: string;
  name?: string;
  [key: string]: any;
}

export class UserAnalytics {
  private userId?: string;
  private userProperties: UserProperties = {};

  identify(userId: string, properties?: UserProperties) {
    this.userId = userId;
    if (properties) {
      this.userProperties = { ...this.userProperties, ...properties };
    }
    
    console.log('User identified:', userId, this.userProperties);
  }

  track(event: string, properties?: Record<string, any>) {
    const eventData: AnalyticsEvent = {
      name: event,
      properties: {
        ...properties,
        userId: this.userId,
        ...this.userProperties,
      },
      timestamp: Date.now(),
    };

    console.log('Event tracked:', eventData);
    
    // Send to analytics service
    this.sendToAnalytics(eventData);
  }

  page(pageName: string, properties?: Record<string, any>) {
    this.track('page_view', {
      page: pageName,
      ...properties,
    });
  }

  trackConversion(event: string, value?: number, currency?: string) {
    this.track(`conversion_${event}`, {
      value,
      currency: currency || 'USD',
    });
  }

  trackFeatureUsage(feature: string, action: string) {
    this.track('feature_usage', {
      feature,
      action,
    });
  }

  trackError(error: Error, context?: Record<string, any>) {
    this.track('error', {
      message: error.message,
      stack: error.stack,
      ...context,
    });
  }

  private async sendToAnalytics(event: AnalyticsEvent) {
    // Placeholder for actual analytics service integration
    // Could send to Google Analytics, Mixpanel, Amplitude, etc.
  }

  reset() {
    this.userId = undefined;
    this.userProperties = {};
  }
}

export const userAnalytics = new UserAnalytics();
