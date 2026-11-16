import assert from 'node:assert/strict';
import test from 'node:test';
import * as z from 'zod/v4';
import { metricValues, page, planChanges, write } from '../api/_lib/mcp/schemas.js';
import { tools } from '../api/_lib/mcp/tools.js';

// Canonical PostgreSQL catalog identity returned by search_exercises('rowing').
const legacyId = '25168070-f1ae-e7a9-97b9-4a7a99b8e4d1';
const rfc4Id = '6ed4d260-2831-42ca-86de-e76409eac4cc';
const getExercise = tools.find(tool => tool.name === 'get_exercise')!;
const malformed = [
  '', legacyId.replaceAll('-', ''), `{${legacyId}}`, legacyId.slice(0, -1),
  `${legacyId}0`, legacyId.replace('25168070', 'g5168070'), ` ${legacyId}`,
  `${legacyId}\n`,
];

test('get_exercise accepts legacy PostgreSQL and RFC catalog IDs without rewriting them', () => {
  for (const exerciseId of [legacyId, rfc4Id, legacyId.toUpperCase()]) {
    assert.deepEqual(getExercise.schema.parse({ exerciseId }), { exerciseId });
  }
  assert.deepEqual(metricValues.parse({ [legacyId]: 7 }), { [legacyId]: 7 });
  assert.equal(page.cursor.parse(legacyId), legacyId);
  assert.deepEqual(planChanges.parse([{ type: 'remove_exercise', dayId: legacyId, occurrenceId: rfc4Id }]),
    [{ type: 'remove_exercise', dayId: legacyId, occurrenceId: rfc4Id }]);
});

test('entity IDs reject malformed and noncanonical PostgreSQL text', () => {
  for (const exerciseId of malformed) {
    assert.equal(getExercise.schema.safeParse({ exerciseId }).success, false, JSON.stringify(exerciseId));
  }
});

test('published entity schema uses an exact string pattern without the RFC UUID format', () => {
  const schema = z.toJSONSchema(getExercise.schema).properties?.exerciseId;
  assert.ok(schema && typeof schema === 'object');
  assert.equal(schema.type, 'string');
  assert.equal(schema.format, undefined);
  assert.equal(schema.minLength, 36);
  assert.equal(schema.maxLength, 36);
  assert.equal(typeof schema.pattern, 'string');
  const pattern = new RegExp(String(schema.pattern));
  assert.equal(pattern.test(legacyId), true);
  assert.equal(pattern.test(rfc4Id), true);
  assert.equal(pattern.test(legacyId.replace('25168070', 'g5168070')), false);
  assert.equal(pattern.test(legacyId.replaceAll('-', '')), false);
});

test('write operation IDs retain their separate RFC UUID contract', () => {
  assert.equal(write.operationId.parse(rfc4Id), rfc4Id);
  assert.equal(write.operationId.safeParse(legacyId).success, false);
  assert.equal(write.operationId.safeParse(`${rfc4Id}\n`).success, false);
  assert.equal(z.toJSONSchema(write.operationId).format, 'uuid');
});

const completionInput = {
  operationId: rfc4Id, sessionId: legacyId, controlVersion: 1,
  expectedRevision: 'completion-choice-revision',
};
const completion = tools.find(tool => tool.name === 'complete_workout')!;
const otherSessionActions = ['pause_workout', 'resume_workout', 'cancel_workout'] as const;

test('complete_workout accepts an optional advance/stay choice without changing omitted-input behavior', () => {
  assert.deepEqual(completion.schema.parse(completionInput), completionInput);
  for (const progression of ['advance', 'stay']) {
    assert.deepEqual(completion.schema.parse({ ...completionInput, progression }), { ...completionInput, progression });
  }
  for (const progression of ['skip', 'advance ', null, true]) {
    assert.equal(completion.schema.safeParse({ ...completionInput, progression }).success, false);
  }
  const schema = z.toJSONSchema(completion.schema);
  assert.equal(schema.required?.includes('progression'), false);
  assert.deepEqual(schema.properties?.progression, { type: 'string', enum: ['advance', 'stay'] });
});

test('pause, resume and cancel reject progression while retaining their original inputs', () => {
  for (const name of otherSessionActions) {
    const tool = tools.find(candidate => candidate.name === name)!;
    assert.deepEqual(tool.schema.parse(completionInput), completionInput);
    for (const progression of ['advance', 'stay']) {
      assert.equal(tool.schema.safeParse({ ...completionInput, progression }).success, false, name);
    }
    const schema = z.toJSONSchema(tool.schema);
    assert.equal(schema.properties?.progression, undefined);
    assert.equal(schema.additionalProperties, false);
  }
});

test('completion and existing session actions reject caller-selected raw progression authority', () => {
  for (const name of ['complete_workout', ...otherSessionActions]) {
    const tool = tools.find(candidate => candidate.name === name)!;
    for (const extra of [{ planId: rfc4Id }, { current_index: 0 }, { nextIndex: 2 }, { userId: rfc4Id },
      { completionChoice: { state: 'advanced', revision: 'forged' } }]) {
      assert.equal(tool.schema.safeParse({ ...completionInput, ...extra }).success, false, `${name}: ${Object.keys(extra)[0]}`);
    }
  }
});

test('completion progression stays within the existing 34 tools with explicit destructive metadata', () => {
  assert.equal(tools.length, 34);
  assert.equal(new Set(tools.map(tool => tool.name)).size, 34);
  assert.equal(completion.write, true);
  assert.equal(completion.destructive, true);
  assert.equal(tools.find(tool => tool.name === 'cancel_workout')?.destructive, true);
  for (const name of ['pause_workout', 'resume_workout']) {
    assert.equal(tools.find(tool => tool.name === name)?.destructive, false);
  }
});
