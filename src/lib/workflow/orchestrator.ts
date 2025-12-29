/**
 * WORKFLOW ORCHESTRATOR
 * Inspirado em n8n, mas simplificado e integrado
 * 
 * EXEMPLO DE WORKFLOW:
 * ====================
 * Nova chamada recebida →
 *   1. Criar registro no DB
 *   2. Enviar notificação ao usuário
 *   3. Iniciar transcription job
 *   4. Aguardar transcription
 *   5. Salvar transcription no DB
 *   6. Enviar email com resumo
 *   7. Webhook para sistema externo
 */

import { EventEmitter } from 'events';
import { jobQueueManager } from '../queue/job-queue-manager';
import { redis } from '../cache/redis-client';

// ============================================
// TIPOS E INTERFACES
// ============================================

export enum NodeType {
  TRIGGER = 'trigger',
  ACTION = 'action',
  CONDITION = 'condition',
  TRANSFORM = 'transform',
  DELAY = 'delay',
}

export enum TriggerType {
  WEBHOOK = 'webhook',
  SCHEDULE = 'schedule',
  DATABASE = 'database',
  MANUAL = 'manual',
}

export interface WorkflowNode {
  id: string;
  type: NodeType;
  name: string;
  config: Record<string, any>;
  next?: string | { true: string; false: string }; // For conditions
  onError?: string; // Error handling node
}

export interface Workflow {
  id: string;
  name: string;
  description?: string;
  enabled: boolean;
  trigger: {
    type: TriggerType;
    config: Record<string, any>;
  };
  nodes: WorkflowNode[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface ExecutionContext {
  workflowId: string;
  executionId: string;
  triggeredBy: string;
  triggeredAt: string;
  data: Record<string, any>;
  variables: Record<string, any>;
  currentNode?: string;
  completedNodes: string[];
  errors: Array<{
    nodeId: string;
    error: string;
    timestamp: string;
  }>;
}

// ============================================
// WORKFLOW ORCHESTRATOR
// ============================================

export class WorkflowOrchestrator extends EventEmitter {
  private workflows: Map<string, Workflow> = new Map();
  private activeExecutions: Map<string, ExecutionContext> = new Map();
  private nodeHandlers: Map<string, (node: WorkflowNode, ctx: ExecutionContext) => Promise<any>> = new Map();

  constructor() {
    super();
    this.registerDefaultHandlers();
  }

  // Register workflow
  registerWorkflow(workflow: Workflow): void {
    this.workflows.set(workflow.id, workflow);
    
    // Setup trigger
    this.setupTrigger(workflow);
    
    console.log(`Workflow registered: ${workflow.name} (${workflow.id})`);
  }

  // Execute workflow
  async executeWorkflow(
    workflowId: string,
    initialData: Record<string, any>,
    triggeredBy: string = 'system'
  ): Promise<ExecutionContext> {
    const workflow = this.workflows.get(workflowId);
    
    if (!workflow) {
      throw new Error(`Workflow ${workflowId} not found`);
    }

    if (!workflow.enabled) {
      throw new Error(`Workflow ${workflowId} is disabled`);
    }

    // Create execution context
    const executionId = `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const context: ExecutionContext = {
      workflowId,
      executionId,
      triggeredBy,
      triggeredAt: new Date().toISOString(),
      data: initialData,
      variables: {},
      completedNodes: [],
      errors: [],
    };

    this.activeExecutions.set(executionId, context);
    this.emit('execution:started', context);

    try {
      // Start from first node
      const firstNode = workflow.nodes[0];
      if (firstNode) {
        await this.executeNode(firstNode, context);
      }

      this.emit('execution:completed', context);
      return context;
    } catch (error) {
      context.errors.push({
        nodeId: context.currentNode || 'unknown',
        error: (error as Error).message,
        timestamp: new Date().toISOString(),
      });
      
      this.emit('execution:failed', context, error);
      throw error;
    } finally {
      // Cleanup after some time
      setTimeout(() => {
        this.activeExecutions.delete(executionId);
      }, 3600000); // 1 hour
    }
  }

  // Execute single node
  private async executeNode(
    node: WorkflowNode,
    context: ExecutionContext
  ): Promise<void> {
    const workflow = this.workflows.get(context.workflowId)!;
    
    context.currentNode = node.id;
    this.emit('node:started', node, context);

    try {
      // Get handler for node type
      const handlerKey = `${node.type}:${node.config.action || node.type}`;
      const handler = this.nodeHandlers.get(handlerKey) || this.nodeHandlers.get(node.type);

      if (!handler) {
        throw new Error(`No handler registered for node type: ${node.type}`);
      }

      // Execute handler
      const result = await handler(node, context);

      // Store result in variables
      if (result !== undefined) {
        context.variables[node.id] = result;
      }

      context.completedNodes.push(node.id);
      this.emit('node:completed', node, context, result);

      // Determine next node
      let nextNodeId: string | undefined;

      if (node.type === NodeType.CONDITION) {
        const condition = result as boolean;
        const nextMap = node.next as { true: string; false: string };
        nextNodeId = condition ? nextMap.true : nextMap.false;
      } else {
        nextNodeId = node.next as string;
      }

      // Execute next node
      if (nextNodeId) {
        const nextNode = workflow.nodes.find(n => n.id === nextNodeId);
        if (nextNode) {
          await this.executeNode(nextNode, context);
        }
      }
    } catch (error) {
      this.emit('node:failed', node, context, error);

      // Handle error
      if (node.onError) {
        const errorNode = workflow.nodes.find(n => n.id === node.onError);
        if (errorNode) {
          await this.executeNode(errorNode, context);
          return; // Continue execution
        }
      }

      throw error; // Propagate error
    }
  }

  // Setup workflow trigger
  private setupTrigger(workflow: Workflow): void {
    const { trigger } = workflow;

    switch (trigger.type) {
      case TriggerType.WEBHOOK:
        // Webhook triggers are handled by API routes
        break;

      case TriggerType.SCHEDULE:
        this.setupScheduleTrigger(workflow);
        break;

      case TriggerType.DATABASE:
        this.setupDatabaseTrigger(workflow);
        break;

      case TriggerType.MANUAL:
        // Manual triggers don't need setup
        break;
    }
  }

  private setupScheduleTrigger(workflow: Workflow): void {
    const { cron } = workflow.trigger.config;
    
    // Use node-cron or similar
    console.log(`Schedule trigger setup for ${workflow.id}: ${cron}`);
    // Implementation would use actual cron library
  }

  private setupDatabaseTrigger(workflow: Workflow): void {
    const { table, event } = workflow.trigger.config;
    
    console.log(`Database trigger setup for ${workflow.id}: ${table}.${event}`);
    // Implementation would use database triggers or polling
  }

  // Register default node handlers
  private registerDefaultHandlers(): void {
    // HTTP Request
    this.nodeHandlers.set('action:http', async (node, ctx) => {
      const { url, method, headers, body } = node.config;
      
      const response = await fetch(url, {
        method: method || 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
        body: body ? JSON.stringify(this.interpolate(body, ctx)) : undefined,
      });

      return {
        status: response.status,
        headers: Object.fromEntries(response.headers),
        data: await response.json().catch(() => response.text()),
      };
    });

    // Database Query
    this.nodeHandlers.set('action:database', async (node, ctx) => {
      const { operation, table, data, where } = node.config;
      
      // Implementation would use actual database client
      console.log(`Database ${operation} on ${table}`);
      
      return { success: true, operation, table };
    });

    // Send Email
    this.nodeHandlers.set('action:email', async (node, ctx) => {
      const { to, subject, body } = this.interpolate(node.config, ctx);
      
      await jobQueueManager.addJob('email', {
        userId: ctx.triggeredBy,
        createdAt: new Date().toISOString(),
        to,
        subject,
        body,
      });

      return { sent: true, to };
    });

    // Condition
    this.nodeHandlers.set(NodeType.CONDITION, async (node, ctx) => {
      const { field, operator, value } = node.config;
      const fieldValue = this.getValueByPath(ctx.data, field) ?? this.getValueByPath(ctx.variables, field);

      switch (operator) {
        case 'equals':
          return fieldValue === value;
        case 'notEquals':
          return fieldValue !== value;
        case 'greaterThan':
          return fieldValue > value;
        case 'lessThan':
          return fieldValue < value;
        case 'contains':
          return String(fieldValue).includes(value);
        default:
          return false;
      }
    });

    // Transform
    this.nodeHandlers.set(NodeType.TRANSFORM, async (node, ctx) => {
      const { expression } = node.config;
      
      // Simple variable substitution
      let result = expression;
      const matches = expression.matchAll(/\{\{(.+?)\}\}/g);
      
      for (const match of matches) {
        const path = match[1].trim();
        const value = this.getValueByPath(ctx.data, path) ?? this.getValueByPath(ctx.variables, path);
        result = result.replace(match[0], value);
      }

      return result;
    });

    // Delay
    this.nodeHandlers.set(NodeType.DELAY, async (node, ctx) => {
      const { duration } = node.config; // in milliseconds
      await new Promise(resolve => setTimeout(resolve, duration));
      return { delayed: duration };
    });
  }

  // Helper: Interpolate variables in config
  private interpolate<T>(obj: T, ctx: ExecutionContext): T {
    const json = JSON.stringify(obj);
    const matches = json.matchAll(/\{\{(.+?)\}\}/g);
    
    let result = json;
    for (const match of matches) {
      const path = match[1].trim();
      const value = this.getValueByPath(ctx.data, path) ?? this.getValueByPath(ctx.variables, path);
      result = result.replace(match[0], JSON.stringify(value));
    }

    return JSON.parse(result);
  }

  // Helper: Get value by dot notation path
  private getValueByPath(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  // Get execution status
  getExecutionStatus(executionId: string): ExecutionContext | undefined {
    return this.activeExecutions.get(executionId);
  }

  // List active executions
  getActiveExecutions(): ExecutionContext[] {
    return Array.from(this.activeExecutions.values());
  }

  // Register custom node handler
  registerNodeHandler(
    type: string,
    handler: (node: WorkflowNode, ctx: ExecutionContext) => Promise<any>
  ): void {
    this.nodeHandlers.set(type, handler);
  }
}

// Singleton
export const workflowOrchestrator = new WorkflowOrchestrator();

// Example workflows
export const exampleWorkflows = {
  callProcessing: {
    id: 'wf_call_processing',
    name: 'Call Processing Workflow',
    description: 'Process incoming calls: transcribe, save, notify',
    enabled: true,
    trigger: {
      type: TriggerType.WEBHOOK,
      config: { path: '/webhooks/call-received' },
    },
    createdBy: 'system',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    nodes: [
      {
        id: 'node_1',
        type: NodeType.ACTION,
        name: 'Save Call to Database',
        config: {
          action: 'database',
          operation: 'insert',
          table: 'calls',
          data: {
            user_id: '{{data.userId}}',
            contact_id: '{{data.contactId}}',
            started_at: '{{data.timestamp}}',
          },
        },
        next: 'node_2',
      },
      {
        id: 'node_2',
        type: NodeType.ACTION,
        name: 'Queue Transcription Job',
        config: {
          action: 'email',
          to: '{{data.userEmail}}',
          subject: 'Call Started',
          body: 'Your call has started processing.',
        },
        next: 'node_3',
      },
      {
        id: 'node_3',
        type: NodeType.CONDITION,
        name: 'Check Call Duration',
        config: {
          field: 'data.duration',
          operator: 'greaterThan',
          value: 60,
        },
        next: {
          true: 'node_4',
          false: 'node_5',
        },
      },
      {
        id: 'node_4',
        type: NodeType.ACTION,
        name: 'Send Long Call Alert',
        config: {
          action: 'email',
          to: 'admin@hello.app',
          subject: 'Long Call Alert',
          body: 'Call exceeded 60 seconds',
        },
      },
      {
        id: 'node_5',
        type: NodeType.ACTION,
        name: 'Complete Processing',
        config: {
          action: 'http',
          url: 'https://api.hello.app/webhooks/call-completed',
          method: 'POST',
          body: {
            callId: '{{node_1.id}}',
            status: 'completed',
          },
        },
      },
    ],
  } as Workflow,
};

export default workflowOrchestrator;
