import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { createServer } from '../src/server.js';

let client: Client;

beforeAll(async () => {
  const server = createServer();
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  const testClient = new Client({ name: 'test-client', version: '1.0.0' });
  await Promise.all([
    server.connect(serverTransport),
    testClient.connect(clientTransport),
  ]);
  client = testClient;
});

afterAll(async () => {
  await client.close();
});

function parseText(result: Awaited<ReturnType<typeof client.callTool>>): unknown {
  const content = result.content as Array<{ type: string; text: string }>;
  return JSON.parse(content[0].text);
}

// ── listTools ─────────────────────────────────────────────────

describe('listTools', () => {
  it('exposes all 5 tools', async () => {
    const { tools } = await client.listTools();
    const names = tools.map((t) => t.name);
    expect(names).toContain('help');
    expect(names).toContain('template');
    expect(names).toContain('validate');
    expect(names).toContain('suggest_mapping');
    expect(names).toContain('auto_spec');
    expect(tools).toHaveLength(5);
  });

  it('each tool has a description and inputSchema', async () => {
    const { tools } = await client.listTools();
    for (const tool of tools) {
      expect(tool.description).toBeTruthy();
      expect(tool.inputSchema).toBeDefined();
    }
  });
});

// ── help ──────────────────────────────────────────────────────

describe('help tool', () => {
  it('returns full catalog when no widget specified', async () => {
    const result = await client.callTool({ name: 'help', arguments: {} });
    const catalog = parseText(result) as Array<{ widget: string }>;
    expect(catalog.length).toBeGreaterThanOrEqual(23);
    expect(catalog.some((w) => w.widget === 'chart.bar')).toBe(true);
    expect(catalog.some((w) => w.widget === 'metric')).toBe(true);
  });

  it('filters by exact widget name', async () => {
    const result = await client.callTool({ name: 'help', arguments: { widget: 'chart.bar' } });
    const items = parseText(result) as Array<{ widget: string }>;
    expect(items).toHaveLength(1);
    expect(items[0].widget).toBe('chart.bar');
  });

  it('filters by category', async () => {
    const result = await client.callTool({ name: 'help', arguments: { widget: 'chart' } });
    const items = parseText(result) as Array<{ widget: string }>;
    expect(items.length).toBeGreaterThanOrEqual(11);
    expect(items.every((w) => w.widget.startsWith('chart.'))).toBe(true);
  });

  it('returns empty array for unknown widget', async () => {
    const result = await client.callTool({ name: 'help', arguments: { widget: 'nonexistent' } });
    const items = parseText(result) as unknown[];
    expect(items).toHaveLength(0);
  });
});

// ── template ──────────────────────────────────────────────────

describe('template tool', () => {
  it('returns a valid spec for metric', async () => {
    const result = await client.callTool({ name: 'template', arguments: { widget: 'metric' } });
    const spec = parseText(result) as { widget: string; data: { value: number } };
    expect(spec.widget).toBe('metric');
    expect(spec.data.value).toBeDefined();
  });

  it('returns a valid spec for chart.bar', async () => {
    const result = await client.callTool({ name: 'template', arguments: { widget: 'chart.bar' } });
    const spec = parseText(result) as { widget: string; data: unknown[]; mapping: { x: string; y: string } };
    expect(spec.widget).toBe('chart.bar');
    expect(Array.isArray(spec.data)).toBe(true);
    expect(spec.mapping.x).toBeDefined();
    expect(spec.mapping.y).toBeDefined();
  });

  it('returns a valid spec for form', async () => {
    const result = await client.callTool({ name: 'template', arguments: { widget: 'form' } });
    const spec = parseText(result) as { widget: string; fields: unknown[] };
    expect(spec.widget).toBe('form');
    expect(Array.isArray(spec.fields)).toBe(true);
  });

  it('returns error for unknown widget', async () => {
    const result = await client.callTool({ name: 'template', arguments: { widget: 'nonexistent' } });
    expect(result.isError).toBe(true);
    const content = result.content as Array<{ type: string; text: string }>;
    expect(content[0].text).toContain('Unknown widget type');
  });
});

// ── validate ──────────────────────────────────────────────────

describe('validate tool', () => {
  it('validates a correct spec', async () => {
    const result = await client.callTool({
      name: 'validate',
      arguments: { spec: { widget: 'metric', data: { value: 42 } } },
    });
    const validation = parseText(result) as { valid: boolean; errors: string[]; warnings: string[] };
    expect(validation.valid).toBe(true);
    expect(validation.errors).toHaveLength(0);
  });

  it('returns errors for invalid spec', async () => {
    const result = await client.callTool({
      name: 'validate',
      arguments: { spec: { widget: '' } },
    });
    const validation = parseText(result) as { valid: boolean; errors: string[] };
    expect(validation.valid).toBe(false);
    expect(validation.errors.length).toBeGreaterThan(0);
  });

  it('returns errors for wrong data type', async () => {
    const result = await client.callTool({
      name: 'validate',
      arguments: { spec: { widget: 'table', data: { not: 'array' } } },
    });
    const validation = parseText(result) as { valid: boolean; errors: string[] };
    expect(validation.valid).toBe(false);
    expect(validation.errors.some((e) => e.includes('array'))).toBe(true);
  });

  it('returns warnings for mismatched mapping keys', async () => {
    const result = await client.callTool({
      name: 'validate',
      arguments: {
        spec: {
          widget: 'chart.bar',
          data: [{ name: 'A', value: 1 }],
          mapping: { x: 'nonexistent', y: 'value' },
        },
      },
    });
    const validation = parseText(result) as { valid: boolean; warnings: string[] };
    expect(validation.valid).toBe(true);
    expect(validation.warnings.some((w) => w.includes('nonexistent'))).toBe(true);
  });
});

// ── suggest_mapping ───────────────────────────────────────────

describe('suggest_mapping tool', () => {
  it('suggests chart.bar for category+value array', async () => {
    const result = await client.callTool({
      name: 'suggest_mapping',
      arguments: {
        data: [{ name: 'A', value: 30 }, { name: 'B', value: 70 }],
      },
    });
    const suggestions = parseText(result) as Array<{ widget: string; confidence: number }>;
    expect(suggestions.length).toBeGreaterThan(0);
    expect(suggestions[0].widget).toBe('chart.bar');
    expect(suggestions[0].confidence).toBeGreaterThanOrEqual(0.9);
  });

  it('suggests metric for object with value key', async () => {
    const result = await client.callTool({
      name: 'suggest_mapping',
      arguments: {
        data: { value: 42, unit: 'users' },
      },
    });
    const suggestions = parseText(result) as Array<{ widget: string; confidence: number }>;
    expect(suggestions[0].widget).toBe('metric');
    expect(suggestions[0].confidence).toBeGreaterThanOrEqual(0.9);
  });

  it('constrains to a specific widget', async () => {
    const result = await client.callTool({
      name: 'suggest_mapping',
      arguments: {
        data: [{ name: 'A', value: 30 }],
        widget: 'chart.pie',
      },
    });
    const suggestions = parseText(result) as Array<{ widget: string }>;
    expect(suggestions).toHaveLength(1);
    expect(suggestions[0].widget).toBe('chart.pie');
  });

  it('returns empty array for null/empty data', async () => {
    const result = await client.callTool({
      name: 'suggest_mapping',
      arguments: { data: [] },
    });
    const suggestions = parseText(result) as unknown[];
    expect(suggestions).toHaveLength(0);
  });

  it('returns low-confidence result for unknown widget constraint', async () => {
    const result = await client.callTool({
      name: 'suggest_mapping',
      arguments: {
        data: [{ name: 'A', value: 30 }],
        widget: 'nonexistent',
      },
    });
    const suggestions = parseText(result) as Array<{ widget: string; confidence: number }>;
    expect(suggestions).toHaveLength(1);
    expect(suggestions[0].widget).toBe('nonexistent');
    expect(suggestions[0].confidence).toBeLessThan(0.5);
  });
});

// ── auto_spec ─────────────────────────────────────────────────

describe('auto_spec tool', () => {
  it('generates a complete spec from data', async () => {
    const result = await client.callTool({
      name: 'auto_spec',
      arguments: {
        data: [{ category: 'Q1', revenue: 100 }, { category: 'Q2', revenue: 150 }],
      },
    });
    const spec = parseText(result) as { widget: string; data: unknown[]; mapping?: { x: string; y: string } };
    expect(spec.widget).toBe('chart.bar');
    expect(spec.data).toHaveLength(2);
    expect(spec.mapping?.x).toBe('category');
    expect(spec.mapping?.y).toBe('revenue');
  });

  it('returns error for empty data', async () => {
    const result = await client.callTool({
      name: 'auto_spec',
      arguments: { data: [] },
    });
    expect(result.isError).toBe(true);
    const content = result.content as Array<{ type: string; text: string }>;
    expect(content[0].text).toContain('Could not generate');
  });

  it('generates metric spec for object data', async () => {
    const result = await client.callTool({
      name: 'auto_spec',
      arguments: {
        data: { value: 95, unit: '%' },
      },
    });
    const spec = parseText(result) as { widget: string; data: { value: number } };
    expect(spec.widget).toBe('metric');
    expect(spec.data.value).toBe(95);
  });
});
