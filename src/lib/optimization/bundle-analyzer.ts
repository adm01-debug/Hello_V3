export interface BundleStats{totalSize:number;chunks:{name:string;size:number}[];modules:{name:string;size:number}[]}
export class BundleAnalyzer{analyze():BundleStats{return{totalSize:0,chunks:[],modules:[]}}}export const bundleAnalyzer=new BundleAnalyzer()
