// @vitest-environment node
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { initDb, closeDb, getDb } from '../index';
import { createProject } from '../projects';
import {
  createCriterionRows,
  getCriterionRows,
  updateCriterionRow,
  getCriterionRow,
  countUnresolvedRows,
  getVpatProgress,
} from '../vpat-criterion-rows';

let projectId: string;
let vpatId: string;
let criterionId: string;

beforeAll(() => {
  initDb(':memory:');
});
afterAll(() => {
  closeDb();
});

beforeEach(() => {
  getDb().prepare('DELETE FROM vpat_criterion_rows').run();
  getDb().prepare('DELETE FROM vpats').run();
  getDb().prepare('DELETE FROM projects').run();
  const project = createProject({ name: 'Test' });
  projectId = project.id;
  // Create a VPAT directly in DB (vpats.ts isn't rewritten yet)
  vpatId = crypto.randomUUID();
  getDb()
    .prepare(
      `
    INSERT INTO vpats (id, project_id, title, standard_edition, product_scope)
    VALUES (?, ?, ?, ?, ?)
  `
    )
    .run(vpatId, projectId, 'Test VPAT', 'WCAG', '["web"]');
  // Get a real criterion ID from the seeded criteria
  const row = getDb().prepare("SELECT id FROM criteria WHERE code = '1.1.1'").get() as {
    id: string;
  };
  criterionId = row.id;
});

describe('createCriterionRows', () => {
  it('inserts rows and they can be retrieved', () => {
    createCriterionRows(vpatId, [{ criterion_id: criterionId, conformance: 'not_evaluated' }]);
    const rows = getCriterionRows(vpatId);
    expect(rows).toHaveLength(1);
    expect(rows[0].criterion_code).toBe('1.1.1');
    expect(rows[0].conformance).toBe('not_evaluated');
  });

  it('sets remarks when provided', () => {
    createCriterionRows(vpatId, [
      {
        criterion_id: criterionId,
        conformance: 'not_applicable',
        remarks: 'Not applicable — web only.',
      },
    ]);
    const rows = getCriterionRows(vpatId);
    expect(rows[0].remarks).toBe('Not applicable — web only.');
  });

  it('inserts multiple rows in one transaction', () => {
    const row2 = getDb().prepare("SELECT id FROM criteria WHERE code = '1.1.1'").get() as {
      id: string;
    };
    const row3 = getDb().prepare("SELECT id FROM criteria WHERE code = '1.3.1'").get() as {
      id: string;
    };
    createCriterionRows(vpatId, [
      { criterion_id: row2.id, conformance: 'not_evaluated' },
      { criterion_id: row3.id, conformance: 'not_evaluated' },
    ]);
    expect(getCriterionRows(vpatId)).toHaveLength(2);
  });
});

describe('getCriterionRow', () => {
  it('returns a single row by id', () => {
    createCriterionRows(vpatId, [{ criterion_id: criterionId, conformance: 'not_evaluated' }]);
    const rows = getCriterionRows(vpatId);
    const found = getCriterionRow(rows[0].id);
    expect(found).not.toBeNull();
    expect(found!.criterion_code).toBe('1.1.1');
  });

  it('returns null for a non-existent id', () => {
    expect(getCriterionRow('non-existent')).toBeNull();
  });
});

describe('updateCriterionRow', () => {
  it('updates conformance', () => {
    createCriterionRows(vpatId, [{ criterion_id: criterionId, conformance: 'not_evaluated' }]);
    const row = getCriterionRows(vpatId)[0];
    const updated = updateCriterionRow(row.id, { conformance: 'supports' });
    expect(updated!.conformance).toBe('supports');
  });

  it('updates remarks', () => {
    createCriterionRows(vpatId, [{ criterion_id: criterionId, conformance: 'not_evaluated' }]);
    const row = getCriterionRows(vpatId)[0];
    const updated = updateCriterionRow(row.id, { remarks: 'Good.' });
    expect(updated!.remarks).toBe('Good.');
  });

  it('sets last_generated_at when ai_reasoning is provided', () => {
    createCriterionRows(vpatId, [{ criterion_id: criterionId, conformance: 'not_evaluated' }]);
    const row = getCriterionRows(vpatId)[0];
    expect(row.last_generated_at).toBeNull();
    const updated = updateCriterionRow(row.id, {
      remarks: 'AI text.',
      ai_confidence: 'high',
      ai_reasoning: 'Step by step.',
    });
    expect(updated!.ai_confidence).toBe('high');
    expect(updated!.ai_reasoning).toBe('Step by step.');
    expect(updated!.last_generated_at).not.toBeNull();
  });

  it('returns null for non-existent row', () => {
    expect(updateCriterionRow('non-existent', { conformance: 'supports' })).toBeNull();
  });
});

describe('countUnresolvedRows', () => {
  it('returns count of not_evaluated rows', () => {
    const c1 = getDb().prepare("SELECT id FROM criteria WHERE code = '1.1.1'").get() as {
      id: string;
    };
    const c2 = getDb().prepare("SELECT id FROM criteria WHERE code = '1.3.1'").get() as {
      id: string;
    };
    createCriterionRows(vpatId, [
      { criterion_id: c1.id, conformance: 'not_evaluated' },
      { criterion_id: c2.id, conformance: 'supports' },
    ]);
    expect(countUnresolvedRows(vpatId)).toBe(1);
  });
});

describe('getVpatProgress', () => {
  it('returns resolved and total counts', () => {
    const c1 = getDb().prepare("SELECT id FROM criteria WHERE code = '1.1.1'").get() as {
      id: string;
    };
    const c2 = getDb().prepare("SELECT id FROM criteria WHERE code = '1.3.1'").get() as {
      id: string;
    };
    createCriterionRows(vpatId, [
      { criterion_id: c1.id, conformance: 'not_evaluated' },
      { criterion_id: c2.id, conformance: 'supports' },
    ]);
    const progress = getVpatProgress(vpatId);
    expect(progress.total).toBe(2);
    expect(progress.resolved).toBe(1);
  });
});
