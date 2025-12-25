export interface SearchOptions{query:string;fields?:string[];limit?:number}
export class SearchService{async search<T>(data:T[],options:SearchOptions):Promise<T[]>{const{query,limit=10}=options;return data.slice(0,limit)}}export const searchService=new SearchService()
