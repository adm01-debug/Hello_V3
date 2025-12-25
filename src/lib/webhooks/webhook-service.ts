export interface Webhook{url:string;events:string[];secret?:string}
export class WebhookService{async trigger(event:string,data:any):Promise<void>{console.log('Webhook triggered:',event,data)}}export const webhookService=new WebhookService()
