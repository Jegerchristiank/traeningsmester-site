import * as z from 'zod/v4';
// PostgreSQL entity IDs may have legacy version/variant bits. Preserve their
// canonical text and publish a string pattern rather than the RFC UUID format.
export const uuid = z.string().length(36).regex(/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/);
const operationId = z.uuid();
export const revision = z.string().min(1).max(200);
export const kind = z.enum(['program', 'mesocycle']);
export const write = { operationId: operationId.describe('Stable UUID for one intended operation. Reuse after timeout; never reuse with different content.') };
export const page = { limit: z.number().int().min(1).max(100).optional(), cursor: uuid.optional() };
const n = z.number().finite();
const nonnegative = n.min(0).max(1_000_000_000);
export const metricValues = z.record(uuid, n.nullable());
export const targets = z.record(uuid, z.strictObject({ min: n.nullable(), max: n.nullable() }));
const sport = z.enum(['swim','run','bike','walk','rower','elliptical','ski','stair_climb','other_cardio']);
export const customDefinition = z.strictObject({
  title: z.string().min(1).max(120), activity: z.enum(['strength', ...sport.options, 'other']), contraction: z.enum(['isometric','isotonic','mixed','not_applicable']),
  description: z.string().min(1).max(2000), steps: z.array(z.strictObject({ id: uuid, text: z.string().min(1).max(1000) })).min(2).max(20),
  equipment: z.array(z.string().min(1).max(80)).max(20), muscles: z.array(z.string().min(1).max(80)).max(20),
  metrics: z.array(z.strictObject({ id: uuid, builtin: z.enum(['reps','weight','duration','distance','rpe','rir','heart_rate','power','pool_lengths']).nullable(),
    label: z.string().min(1).max(60), kind: z.enum(['number','count','duration','scale']), unit: z.string().max(24), scope: z.enum(['set','interval','activity']), order: z.number().int().min(0).max(11), required: z.boolean(),
    scale: z.strictObject({ min: n, max: n, minLabel: z.string().max(60), maxLabel: z.string().max(60) }).nullable() })).min(1).max(12),
});
export const warmup = z.strictObject({ version: z.literal(1), steps: z.array(z.strictObject({ id: z.string().min(1).max(128), target: z.discriminatedUnion('kind', [z.strictObject({ kind: z.literal('reps'), value: z.number().int().min(1).max(999) }), z.strictObject({ kind: z.literal('duration'), seconds: z.number().int().min(1).max(86400) })]), weightKg: z.string().regex(/^\d+(?:\.\d+)?$/).max(128).nullable() })).min(1).max(10), rest: z.discriminatedUnion('kind', [z.strictObject({ kind: z.literal('inherit') }),z.strictObject({ kind: z.literal('override'), seconds: z.number().int().min(0).max(86400) })]) });
export const activityPrescription = z.strictObject({ version: z.literal(1), sport, environment: z.enum(['outdoor','indoor_machine','indoor_no_machine','unknown']), mode: z.enum(['steady','intervals','technique','tempo','sprint','warmup','cooldown']),
  targetDurationSeconds: z.number().int().min(1).max(86400).nullable(), targetDistanceMeters: n.min(1).max(1e6).nullable(), targetRpe: n.min(0).max(10).nullable(), intensityLabel: z.string().max(160).nullable(),
  targetHeartRateMin: z.number().int().min(30).max(250).nullable(), targetHeartRateMax: z.number().int().min(30).max(250).nullable(), targetPowerWatts: n.min(1).max(3000).nullable(), poolLengthMeters: n.min(1).max(100).nullable(),
  intervals: z.strictObject({ warmupSeconds: z.number().int().min(0).max(3600), rounds: z.number().int().min(1).max(100), workSeconds: z.number().int().min(1).max(14400).nullable(), workDistanceMeters: n.min(1).max(100000).nullable(), recoverySeconds: z.number().int().min(0).max(3600), recoveryAfterLast: z.boolean(), cooldownSeconds: z.number().int().min(0).max(3600) }).nullable(), notes: z.string().max(1000).nullable(),
});
export const exercise = z.strictObject({ key: z.string().min(1).max(128), exerciseId: uuid.nullable(), matchKind: z.enum(['catalog','private']), privateExercise: customDefinition.nullable(),
  kind: z.enum(['strength','isometric','cardio']), sets: z.number().int().min(1).max(100), repsMin: z.number().int().min(0).max(999).nullable(), repsMax: z.number().int().min(0).max(999).nullable(), weightKg: nonnegative.nullable(), canonicalWeight: z.string().max(128).nullable().optional(),
  durationSeconds: z.number().int().min(1).max(86400).nullable(), restSeconds: z.number().int().min(0).max(86400), notes: z.string().max(2000), loadGuidance: z.string().max(1000), dropset: z.boolean(), tempo: z.string().max(100).nullable(), rir: z.number().int().min(0).max(100).nullable(), rpe: n.min(0).max(10).nullable(), amrapSetIndex: z.number().int().min(1).max(100).nullable(), supersetGroup: z.string().max(128).nullable(), warmupPlan: warmup.nullable(), activityPrescription: activityPrescription.nullable(), customRevisionId: uuid.nullable().optional(), customTargets: targets.nullable().optional() });
export const day = z.strictObject({ key: z.string().min(1).max(128), name: z.string().min(1).max(200), description: z.string().max(4000), weekday: z.string().max(40).nullable(), exercises: z.array(exercise).max(100) });
export const plan = z.strictObject({ version: z.literal(1), kind, name: z.string().min(1).max(200), description: z.string().max(8000), days: z.array(day).min(1).max(100), blocks: z.array(z.strictObject({ key: z.string().min(1).max(128), name: z.string().min(1).max(200), weeks: z.array(z.strictObject({ week: z.number().int().min(1).max(52), dayKeys: z.array(z.string().min(1).max(128)).max(100) })).min(1).max(52) })).max(52), unresolved: z.array(z.never()).max(0) });
const field = z.string().max(200).nullable().optional();
export const editorPatch = z.strictObject({ sets: z.string().max(20).optional(), gentagelser: z.string().max(20).optional(), setsTo: z.string().max(20).optional(), target_duration_seconds: field, notes: z.string().max(2000).nullable().optional(),
  rest: z.discriminatedUnion('kind',[z.strictObject({kind:z.literal('inherit')}),z.strictObject({kind:z.literal('override'),seconds:z.string().max(20)})]).optional(), target_rir: field,target_rpe:field,amrap_set_index:field,tempo_eccentric:field,tempo_bottom_pause:field,tempo_concentric:field,tempo_top_pause:field,dropset_enabled:z.boolean().optional(),warmup_plan:warmup.nullable().optional() });
export const actorWeight = z.discriminatedUnion('kind',[z.strictObject({kind:z.literal('set'),canonical_kg:z.string().regex(/^\d+(?:\.\d+)?$/).max(128),unit:z.enum(['kg','lbs']).nullable().optional()}),z.strictObject({kind:z.literal('unit'),unit:z.enum(['kg','lbs']).nullable()}),z.strictObject({kind:z.literal('reset')})]);
export const planChanges = z.array(z.discriminatedUnion('type',[
  z.strictObject({type:z.literal('metadata'),name:z.string().min(1).max(200).optional(),description:z.string().max(8000).optional()}),
  z.strictObject({type:z.literal('day_metadata'),dayId:uuid,name:z.string().min(1).max(200).optional(),description:z.string().max(4000).optional()}),
  z.strictObject({type:z.literal('update_exercise'),dayId:uuid,occurrenceId:uuid,patch:editorPatch,actorWeight:actorWeight.optional()}),
  z.strictObject({type:z.literal('activity_prescription'),dayId:uuid,occurrenceId:uuid,prescription:activityPrescription}),
  z.strictObject({type:z.literal('custom_targets'),dayId:uuid,occurrenceId:uuid,targets}),
  z.strictObject({type:z.literal('append_day'),day,weekId:uuid.optional(),weekdayIndex:z.number().int().min(1).max(7).optional(),slotOrder:z.number().int().min(0).max(100).optional()}),
  z.strictObject({type:z.literal('remove_day'),dayId:uuid}),z.strictObject({type:z.literal('reorder_days'),dayIds:z.array(uuid).min(1).max(100),weekId:uuid.optional()}),
  z.strictObject({type:z.literal('append_exercise'),dayId:uuid,exercise}),
  z.strictObject({type:z.literal('remove_exercise'),dayId:uuid,occurrenceId:uuid}),
])).min(1).max(100);
export const setValues = { reps:z.number().int().min(0).max(999).nullable().optional(),weightKg:nonnegative.optional(),durationSeconds:z.number().int().min(0).max(86400).nullable().optional(),rir:z.number().int().min(0).max(100).nullable().optional(),rpe:n.min(0).max(10).nullable().optional(),wasAmrap:z.boolean().optional(),wasDropset:z.boolean().optional() };
export const session = { sessionId:uuid,controlVersion:z.number().int().min(1),expectedRevision:revision };
export const tableNames = ['plans','workouts','completions','sets','archiveLogs','archiveCompletions','archiveSessions','archiveMembership','activities','activityLaps','activitySamples','activityRoutePoints','activityResults','customResults','customDefinitions','customExercises'] as const;
export const transferDocument = z.strictObject({schemaVersion:z.literal(1),format:z.literal('traeningsmester-training'),sourceAccountId:uuid,snapshot:z.strictObject({id:uuid,capturedAt:z.iso.datetime({offset:true}),basis:z.literal('postgres-statement-snapshot')}),units:z.strictObject({weight:z.literal('kg'),duration:z.literal('s'),distance:z.literal('m')}),timeZone:z.literal('UTC').optional(),dataBasis:z.string().max(200).optional(),tables:z.strictObject(Object.fromEntries(tableNames.map(name=>[name,z.array(z.record(z.string(),z.json())).max(100000)])))});
