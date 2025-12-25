export interface WorkflowStep{id:string;action:string;condition?:string}
export class WorkflowEngine{async execute(steps:WorkflowStep[]):Promise<void>{for(const step of steps){console.log('Executing:',step.action)}}}export const workflowEngine=new WorkflowEngine()
