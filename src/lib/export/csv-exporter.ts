export class CSVExporter{export<T>(data:T[]):string{if(!data.length)return'';const headers=Object.keys(data[0]as object).join(',');const rows=data.map(d=>Object.values(d as object).join(','));return[headers,...rows].join('
')}}export const csvExporter=new CSVExporter()
