export class PDFExporter{async export<T>(data:T[]):Promise<Blob>{return new Blob([JSON.stringify(data)],{type:'application/pdf'})}}export const pdfExporter=new PDFExporter()
