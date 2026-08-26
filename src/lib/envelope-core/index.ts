// the-envelope — the sovereignty trio as one library.

export const ENVELOPE = 'resonance-export';
export const ENVELOPE_VERSION = 1;

export interface Envelope<TData extends Record<string, unknown> = Record<string, unknown>> {
  envelope: typeof ENVELOPE;
  envelopeVersion: number;
  app: string;
  appVersion: string;
  exportedAt: string;
  counts: Record<string, number>;
  data: TData;
}

/** Law 1 — seal an export: counts on the outside, data within. */
export function seal<TData extends Record<string, unknown>>(
  app: string,
  appVersion: string,
  data: TData,
  counts: Record<string, number>
): Envelope<TData> {
  return {
    envelope: ENVELOPE,
    envelopeVersion: ENVELOPE_VERSION,
    app,
    appVersion: appVersion || 'unknown',
    exportedAt: new Date().toISOString(),
    counts,
    data,
  };
}

/** The family's filename shape: `<app>-export-<YYYY-MM-DD>.json`. */
export function filename(app: string, date: Date = new Date()): string {
  return `${app}-export-${date.toISOString().split('T')[0]}.json`;
}

export type Reading<TData extends Record<string, unknown>> =
  | { kind: 'envelope'; data: TData; counts: Record<string, number>; envelope: Envelope<TData> }
  | { kind: 'legacy'; raw: unknown };

/**
 * Law 3 (the reading half) — open a parsed file for one app. Returns the
 * envelope's data, a legacy passthrough, or throws a refusal.
 */
export function open<TData extends Record<string, unknown>>(
  parsed: unknown,
  expectedApp: string
): Reading<TData> {
  if (Array.isArray(parsed)) {
    // Legacy bare-array export (pre-envelope) is still honored.
    return { kind: 'legacy', raw: parsed };
  }
  const p = parsed as Partial<Envelope<TData>> | null;
  if (p && p.envelope === ENVELOPE && p.data) {
    if (p.app !== expectedApp) {
      throw new Error(
        `This file belongs to ${p.app ?? 'another app'} — ${expectedApp} imports only its own envelopes.`
      );
    }
    return {
      kind: 'envelope',
      data: p.data as TData,
      counts: (p.counts ?? {}) as Record<string, number>,
      envelope: p as Envelope<TData>,
    };
  }
  throw new Error(`Not a ${expectedApp} export file.`);
}

/**
 * Law 3 (the merging half) — non-destructive merge for definition maps: an
 * existing entry is never overwritten. Returns what was added and what kept.
 */
export function mergeNonDestructive<V>(
  existing: Record<string, V>,
  incoming: Record<string, V>,
  isValid: (v: V) => boolean = (v) => v !== null && v !== undefined && v !== ('' as unknown as V)
): { merged: Record<string, V>; added: number; kept: number } {
  const merged = { ...existing };
  let added = 0;
  let kept = 0;
  for (const [key, value] of Object.entries(incoming)) {
    if (!isValid(value)) continue;
    if (key in merged) kept++;
    else {
      merged[key] = value;
      added++;
    }
  }
  return { merged, added, kept };
}

/**
 * Law 2 — purge that awaits the export: the export must be complete in hand
 * before anything deletes. Runs the steps in order; any failure stops the run
 * so the caller can say what failed.
 */
export async function purgeAfter(
  exportFn: (() => Promise<void>) | null,
  ...purgeSteps: Array<() => Promise<void> | void>
): Promise<void> {
  if (exportFn) await exportFn();
  for (const step of purgeSteps) {
    await step();
  }
}
