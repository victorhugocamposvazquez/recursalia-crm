import { getSupabase } from '@/lib/supabase';

export type AuditPayload = Record<string, unknown>;

export async function writeAudit(params: {
  action: string;
  entityType?: string;
  entityId?: string | null;
  actorEmail?: string | null;
  meta?: AuditPayload;
}): Promise<void> {
  try {
    const supabase = getSupabase();
    const { error } = await supabase.from('audit_log').insert({
      action: params.action,
      entity_type: params.entityType ?? 'course',
      entity_id: params.entityId ?? null,
      actor_email: params.actorEmail ?? null,
      meta: params.meta ?? {},
    });
    if (error) {
      console.warn('[audit]', error.message);
    }
  } catch (e) {
    console.warn('[audit]', e instanceof Error ? e.message : e);
  }
}
