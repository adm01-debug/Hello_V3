export interface Email{to:string;subject:string;body:string}
export class EmailService{async send(email:Email):Promise<void>{console.log('Sending email:',email)}}export const emailService=new EmailService()
