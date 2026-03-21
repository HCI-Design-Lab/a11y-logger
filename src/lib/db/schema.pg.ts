import { pgTable, text, boolean, doublePrecision, integer } from 'drizzle-orm/pg-core';

export const projects = pgTable('projects', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  product_url: text('product_url'),
  status: text('status').notNull().default('active'),
  settings: text('settings').notNull().default('{}'),
  created_by: text('created_by'),
  created_at: text('created_at').notNull(),
  updated_at: text('updated_at').notNull(),
});

export const assessments = pgTable('assessments', {
  id: text('id').primaryKey(),
  project_id: text('project_id').notNull(),
  name: text('name').notNull(),
  description: text('description'),
  test_date_start: text('test_date_start'),
  test_date_end: text('test_date_end'),
  status: text('status').notNull().default('ready'),
  assigned_to: text('assigned_to'),
  created_by: text('created_by'),
  created_at: text('created_at').notNull(),
  updated_at: text('updated_at').notNull(),
});

export const issues = pgTable('issues', {
  id: text('id').primaryKey(),
  assessment_id: text('assessment_id').notNull(),
  title: text('title').notNull(),
  description: text('description'),
  url: text('url'),
  severity: text('severity').notNull().default('medium'),
  status: text('status').notNull().default('open'),
  wcag_codes: text('wcag_codes').notNull().default('[]'),
  section_508_codes: text('section_508_codes').notNull().default('[]'),
  eu_codes: text('eu_codes').notNull().default('[]'),
  ai_suggested_codes: text('ai_suggested_codes').notNull().default('[]'),
  ai_confidence_score: doublePrecision('ai_confidence_score'),
  device_type: text('device_type'),
  browser: text('browser'),
  operating_system: text('operating_system'),
  assistive_technology: text('assistive_technology'),
  user_impact: text('user_impact'),
  selector: text('selector'),
  code_snippet: text('code_snippet'),
  suggested_fix: text('suggested_fix'),
  evidence_media: text('evidence_media').notNull().default('[]'),
  tags: text('tags').notNull().default('[]'),
  created_by: text('created_by'),
  resolved_by: text('resolved_by'),
  resolved_at: text('resolved_at'),
  created_at: text('created_at').notNull(),
  updated_at: text('updated_at').notNull(),
});

export const reports = pgTable('reports', {
  id: text('id').primaryKey(),
  project_id: text('project_id'),
  title: text('title').notNull(),
  type: text('type').notNull().default('detailed'),
  content: text('content'),
  ai_generated: boolean('ai_generated').notNull().default(false),
  created_by: text('created_by'),
  created_at: text('created_at').notNull(),
  updated_at: text('updated_at').notNull(),
});

export const reportAssessments = pgTable('report_assessments', {
  report_id: text('report_id').notNull(),
  assessment_id: text('assessment_id').notNull(),
});

export const vpats = pgTable('vpats', {
  id: text('id').primaryKey(),
  project_id: text('project_id').notNull(),
  title: text('title').notNull(),
  wcag_version: text('wcag_version').notNull().default('2.1'),
  wcag_level: text('wcag_level').notNull().default('AA'),
  standard_edition: text('standard_edition').notNull().default('508'),
  product_scope: text('product_scope'),
  created_by: text('created_by'),
  created_at: text('created_at').notNull(),
  updated_at: text('updated_at').notNull(),
});

export const criteria = pgTable('criteria', {
  id: text('id').primaryKey(),
  code: text('code').notNull(),
  name: text('name').notNull(),
  description: text('description'),
  standard: text('standard').notNull(),
  wcag_version: text('wcag_version'),
  level: text('level'),
  editions: text('editions').notNull().default('[]'),
  product_types: text('product_types').notNull().default('[]'),
  sort_order: integer('sort_order').notNull().default(0),
});

export const vpatCriterionRows = pgTable('vpat_criterion_rows', {
  id: text('id').primaryKey(),
  vpat_id: text('vpat_id').notNull(),
  criterion_id: text('criterion_id').notNull(),
  conformance: text('conformance').notNull().default('not-evaluated'),
  remarks: text('remarks'),
  ai_confidence: text('ai_confidence'),
  ai_reasoning: text('ai_reasoning'),
  created_at: text('created_at').notNull(),
  updated_at: text('updated_at').notNull(),
});

export const settings = pgTable('settings', {
  key: text('key').primaryKey(),
  value: text('value').notNull(),
});

export const users = pgTable('users', {
  id: text('id').primaryKey(),
  username: text('username').notNull().unique(),
  password_hash: text('password_hash').notNull(),
  role: text('role').notNull().default('member'),
  created_at: text('created_at').notNull(),
  updated_at: text('updated_at').notNull(),
});
