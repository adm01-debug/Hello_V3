export interface Template{id:string;name:string;content:string}
export class TemplateService{private templates:Template[]=[];create(template:Template):void{this.templates.push(template)}}export const templateService=new TemplateService()
