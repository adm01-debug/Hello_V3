import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";
import { buildCorsHeaders } from "./cors.ts";

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

export const validateBody = async <T>(
  req: Request,
  schema: z.ZodSchema<T>,
  corsHeaders: Record<string, string> = {}
): Promise<{ data?: T; errorResponse?: Response }> => {
  try {
    const body = await req.json();
    const result = schema.safeParse(body);

    if (!result.success) {
      const fields = result.error.errors.map((e) => ({
        field: e.path.join("."),
        error: e.message,
      }));

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
