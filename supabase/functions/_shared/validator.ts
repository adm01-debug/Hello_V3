import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";
import { buildCorsHeaders } from "./cors.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { trackMetric } from "./observability.ts";

export type ValidationError = {
  field: string;
  error: string;
};

export type StandardErrorResponse = {
  code: string;
  message: string;
  fields?: ValidationError[];
};

export const createErrorResponse = (
  message: string,
  code = "INTERNAL_ERROR",
  fields?: ValidationError[],
  status = 400,
  corsHeaders: Record<string, string> = {}
) => {
  const body: StandardErrorResponse = { code, message };
  if (fields) body.fields = fields;

  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
};

const logValidationError = async (
  req: Request,
  endpoint: string,
  fields: ValidationError[],
  userId?: string
) => {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const forwarded = req.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0].trim() : '0.0.0.0';

    await supabase.from('audit_logs').insert({
      action: 'VALIDATION_ERROR',
      resource_type: 'api_endpoint',
      resource_id: endpoint,
      user_id: userId,
      ip_address: ip,
      details: {
        fields,
        url: req.url,
        method: req.method,
        userAgent: req.headers.get('user-agent')
      }
    });
  } catch (err) {
    console.error('[validator] Audit log failed:', err);
  }
};

export const validateBody = async <T>(
  req: Request,
  schema: z.ZodSchema<T>,
  corsHeaders: Record<string, string> = {},
  options: { endpoint?: string; userId?: string; audit?: boolean } = {}
): Promise<{ data?: T; errorResponse?: Response }> => {
  try {
    const body = await req.json();
    const result = schema.safeParse(body);

    if (!result.success) {
      const fields = result.error.errors.map((e) => ({
        field: e.path.join("."),
        error: e.message,
      }));

      if (options.audit && options.endpoint) {
        // Run audit logging in background
        logValidationError(req, options.endpoint, fields, options.userId).catch(console.error);
        trackMetric('validation_error_422', 1, { endpoint: options.endpoint }).catch(console.error);
      }

      return {
        errorResponse: createErrorResponse(
          "Validation failed",
          "VALIDATION_ERROR",
          fields,
          422,
          corsHeaders
        ),
      };
    }

    return { data: result.data };
  } catch (err) {
    return {
      errorResponse: createErrorResponse(
        "Invalid JSON payload",
        "INVALID_JSON",
        undefined,
        400,
        corsHeaders
      ),
    };
  }
};
