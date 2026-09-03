#!/usr/bin/env node
// Validates every repo's project.meta.json against project.meta.schema.json.
//
// Implements the subset of JSON Schema the metadata schema actually uses
// (type, required, enum, pattern, minimum/maximum, items, properties) so the
// check runs with no dependencies in any repo.
//
// Usage:
//   node scripts/meta/validate-project-meta.mjs
//   node scripts/meta/validate-project-meta.mjs --only=bbeats

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { repoRegistry } from './repo-registry.mjs';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const schema = JSON.parse(fs.readFileSync(path.join(scriptDir, 'template', 'project.meta.schema.json'), 'utf8'));

const onlyArg = process.argv.slice(2).find((arg) => arg.startsWith('--only='));
const only = onlyArg ? new Set(onlyArg.slice('--only='.length).split(',').map((value) => value.trim())) : null;

let failures = 0;
let checked = 0;

for (const entry of repoRegistry) {
  if (only && !only.has(entry.slug)) continue;
  const metaPath = path.join(entry.dir, 'project.meta.json');
  if (!fs.existsSync(metaPath)) {
    console.log('MISSING  ' + entry.slug + '  (' + metaPath + ')');
    failures += 1;
    continue;
  }

  let meta;
  try {
    meta = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
  } catch (error) {
    console.log('INVALID  ' + entry.slug + '  not parseable: ' + error.message);
    failures += 1;
    continue;
  }

  checked += 1;
  const errors = validate(meta, schema, '');
  if (errors.length === 0) {
    console.log('ok       ' + entry.slug);
    continue;
  }
  failures += 1;
  console.log('FAIL     ' + entry.slug);
  for (const error of errors) console.log('           ' + error);
}

console.log('\n' + checked + ' metadata files checked, ' + failures + ' problems.');
process.exit(failures === 0 ? 0 : 1);

function validate(value, node, pointer) {
  const errors = [];
  if (!node || typeof node !== 'object') return errors;

  if (node.type && !matchesType(value, node.type)) {
    return [pointer + ' should be ' + node.type + ', got ' + describe(value)];
  }
  if (node.enum && !node.enum.includes(value)) {
    errors.push(pointer + ' should be one of ' + node.enum.join(', ') + ', got ' + JSON.stringify(value));
  }
  if (node.pattern && typeof value === 'string' && !new RegExp(node.pattern).test(value)) {
    errors.push(pointer + ' does not match ' + node.pattern + ': ' + JSON.stringify(value));
  }
  if (typeof value === 'number') {
    if (node.minimum !== undefined && value < node.minimum) errors.push(pointer + ' is below ' + node.minimum);
    if (node.maximum !== undefined && value > node.maximum) errors.push(pointer + ' is above ' + node.maximum);
    if (node.type === 'integer' && !Number.isInteger(value)) errors.push(pointer + ' should be an integer');
  }
  if (Array.isArray(value) && node.items) {
    value.forEach((item, index) => errors.push(...validate(item, node.items, pointer + '[' + index + ']')));
  }
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    for (const key of node.required ?? []) {
      if (!(key in value)) errors.push((pointer || 'root') + ' is missing required "' + key + '"');
    }
    for (const [key, child] of Object.entries(node.properties ?? {})) {
      if (!(key in value)) continue;
      errors.push(...validate(value[key], child, pointer + '/' + key));
    }
  }
  return errors;
}

function matchesType(value, type) {
  switch (type) {
    case 'object': return value !== null && typeof value === 'object' && !Array.isArray(value);
    case 'array': return Array.isArray(value);
    case 'string': return typeof value === 'string';
    case 'integer': return Number.isInteger(value);
    case 'number': return typeof value === 'number';
    case 'boolean': return typeof value === 'boolean';
    default: return true;
  }
}

function describe(value) {
  if (Array.isArray(value)) return 'array';
  if (value === null) return 'null';
  return typeof value;
}
