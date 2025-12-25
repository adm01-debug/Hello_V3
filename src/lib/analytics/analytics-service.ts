export interface AnalyticsEvent{name:string;properties?:Record<string,any>;timestamp:Date}
export class AnalyticsService{track(event:AnalyticsEvent):void{console.log('Analytics:',event)}}export const analyticsService=new AnalyticsService()
