import { NextRequest } from 'next/server';
import { requireAuthApi } from '@/lib/auth-api';
import { courseInputPayloadFromBody } from '@/lib/courseCreationPayload';
import { createManualDraftCourse } from '@/services/courseOrchestrator';
import { jsonResponse, errorResponse } from '@/utils/api-response';

/** Borrador con estructura placeholder editable, sin generación por IA. */
export async function POST(req: NextRequest) {
  const { error: authError } = await requireAuthApi();
  if (authError) return authError;

  try {
    const body = (await req.json()) as Record<string, unknown>;
    let payload;
    try {
      payload = courseInputPayloadFromBody(body);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Invalid body';
      return errorResponse(msg, 400);
    }

    const course = await createManualDraftCourse(payload);
    return jsonResponse(course, 201);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return errorResponse('Create manual draft failed', 500, msg);
  }
}
