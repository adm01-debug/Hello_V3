/**
 * Request Validation Middleware
 * Validates incoming requests against schemas
 */

export interface ValidationRule {
  field: string;
  type: 'string' | 'number' | 'boolean' | 'array' | 'object' | 'email' | 'url';
  required?: boolean;
  min?: number;
  max?: number;
  pattern?: RegExp;
  enum?: any[];
}

export interface ValidationSchema {
  body?: ValidationRule[];
  query?: ValidationRule[];
  params?: ValidationRule[];
}

export interface ValidationError {
  field: string;
  message: string;
  value?: any;
}

export class RequestValidator {
  validate(data: any, rules: ValidationRule[]): ValidationError[] {
    const errors: ValidationError[] = [];

    for (const rule of rules) {
      const value = data[rule.field];

      if (rule.required && (value === undefined || value === null)) {
        errors.push({
          field: rule.field,
          message: `${rule.field} is required`,
        });
        continue;
      }

      if (value === undefined || value === null) continue;

      if (rule.type === 'email' && !this.isValidEmail(value)) {
        errors.push({
          field: rule.field,
          message: `${rule.field} must be a valid email`,
          value,
        });
      }

      if (rule.type === 'url' && !this.isValidURL(value)) {
        errors.push({
          field: rule.field,
          message: `${rule.field} must be a valid URL`,
          value,
        });
      }

      if (rule.type && typeof value !== rule.type) {
        errors.push({
          field: rule.field,
          message: `${rule.field} must be of type ${rule.type}`,
          value,
        });
      }

      if (rule.min !== undefined && typeof value === 'string' && value.length < rule.min) {
        errors.push({
          field: rule.field,
          message: `${rule.field} must be at least ${rule.min} characters`,
          value,
        });
      }

      if (rule.max !== undefined && typeof value === 'string' && value.length > rule.max) {
        errors.push({
          field: rule.field,
          message: `${rule.field} must be at most ${rule.max} characters`,
          value,
        });
      }

      if (rule.pattern && !rule.pattern.test(String(value))) {
        errors.push({
          field: rule.field,
          message: `${rule.field} format is invalid`,
          value,
        });
      }

      if (rule.enum && !rule.enum.includes(value)) {
        errors.push({
          field: rule.field,
          message: `${rule.field} must be one of: ${rule.enum.join(', ')}`,
          value,
        });
      }
    }

    return errors;
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private isValidURL(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }
}

export const validationMiddleware = (schema: ValidationSchema) => {
  const validator = new RequestValidator();

  return async (req: Request, res: Response, next: Function) => {
    const errors: ValidationError[] = [];

    if (schema.body) {
      const bodyErrors = validator.validate(req.body || {}, schema.body);
      errors.push(...bodyErrors);
    }

    if (schema.query) {
      const url = new URL(req.url);
      const query = Object.fromEntries(url.searchParams);
      const queryErrors = validator.validate(query, schema.query);
      errors.push(...queryErrors);
    }

    if (schema.params) {
      const paramsErrors = validator.validate(req.params || {}, schema.params);
      errors.push(...paramsErrors);
    }

    if (errors.length > 0) {
      return new Response(JSON.stringify({ errors }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return next();
  };
};

export const requestValidator = new RequestValidator();
