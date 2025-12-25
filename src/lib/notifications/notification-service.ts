export interface Notification{id:string;type:'info'|'success'|'warning'|'error';message:string;createdAt:Date}
export class NotificationService{private notifications:Notification[]=[];send(type:Notification['type'],message:string):void{this.notifications.push({id:Math.random().toString(36),type,message,createdAt:new Date()})}}export const notificationService=new NotificationService()
