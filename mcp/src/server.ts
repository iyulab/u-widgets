import { createRequire } from 'node:module';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { help, template, suggestMapping, autoSpec } from '@iyulab/u-widgets/tools';
import { validate } from '@iyulab/u-widgets';

// src/ and dist/ sit at the same depth, so both the tsx and the built entry resolve the manifest.
const { version } = createRequire(import.meta.url)('../package.json') as { version: string };

type ToolResult = { content: Array<{ type: 'text'; text: string }>; isError?: boolean };

function errorResult(err: unknown): ToolResult {
  const msg = err instanceof Error ? err.message : String(err);
  return { content: [{ type: 'text', text: `Internal error: ${msg}` }], isError: true };
}

/** A record of arbitrary values keyed by string — Zod 4 requires the key schema explicitly. */
const record = () => z.record(z.string(), z.unknown());

/**
 * Create and configure the u-widgets MCP server.
 *
 * Returns a configured McpServer instance without connecting
 * to any transport — the caller is responsible for connecting.
 *
 * Every tool's input is a strict object: the advertised JSON Schema carries
 * `additionalProperties: false`, and an unknown argument is rejected rather than silently dropped.
 */
export function createServer(): McpServer {
  const server = new McpServer({
    name: 'u-widgets-mcp',
    version,
  });

  // ── Tool: help ──────────────────────────────────────────────
  server.registerTool(
    'help',
    {
      description: 'List available u-widget types. Returns the full catalog when no argument is given, or filters by widget name or category (e.g. "chart", "chart.bar", "display").',
      inputSchema: z.strictObject({
        widget: z.string().max(100).optional().describe('Widget type or category to filter (e.g. "chart.bar", "chart", "display"). Omit for full catalog.'),
      }),
    },
    async ({ widget }) => {
      try {
        const result = widget ? help(widget) : help();
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      } catch (err) {
        return errorResult(err);
      }
    },
  );

  // ── Tool: template ──────────────────────────────────────────
  server.registerTool(
    'template',
    {
      description: 'Generate a minimal, valid u-widget spec with sample data for a given widget type. Use this as a starting point when creating widgets.',
      inputSchema: z.strictObject({
        widget: z.string().max(100).describe('Widget type (e.g. "metric", "chart.bar", "table", "form").'),
      }),
    },
    async ({ widget }) => {
      try {
        const result = template(widget);
        if (!result) {
          return {
            content: [{ type: 'text', text: `Unknown widget type: "${widget}". Use the "help" tool to list available types.` }],
            isError: true,
          };
        }
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      } catch (err) {
        return errorResult(err);
      }
    },
  );

  // ── Tool: validate ─────────────────────────────────────────
  server.registerTool(
    'validate',
    {
      description: 'Validate a u-widget spec. Returns errors (fatal) and warnings (non-fatal). Use this to check if a spec is correct before rendering.',
      inputSchema: z.strictObject({
        spec: record().describe('The u-widget spec object to validate. Must be a plain object with a "widget" field.'),
      }),
    },
    async ({ spec }) => {
      try {
        const result = validate(spec);
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      } catch (err) {
        return errorResult(err);
      }
    },
  );

  // ── Tool: suggest_mapping ──────────────────────────────────
  server.registerTool(
    'suggest_mapping',
    {
      description: 'Analyze data and suggest the best widget type with auto-inferred mapping. Returns ranked suggestions sorted by confidence. Optionally constrain to a specific widget type.',
      inputSchema: z.strictObject({
        data: z.union([record(), z.array(record())]).describe('The data to analyze — a single object or an array of records.'),
        widget: z.string().max(100).optional().describe('Optional widget type to constrain the suggestion (e.g. "chart.pie"). Must be a known widget type from the catalog.'),
      }),
    },
    async ({ data, widget }) => {
      try {
        const result = suggestMapping(data, widget);
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      } catch (err) {
        return errorResult(err);
      }
    },
  );

  // ── Tool: auto_spec ────────────────────────────────────────
  server.registerTool(
    'auto_spec',
    {
      description: 'Generate a complete, ready-to-use u-widget spec from raw data. Picks the best widget type and mapping automatically. One-call convenience for quick visualizations.',
      inputSchema: z.strictObject({
        data: z.union([record(), z.array(record())]).describe('The data to visualize — a single object or an array of records.'),
      }),
    },
    async ({ data }) => {
      try {
        const result = autoSpec(data);
        if (!result) {
          return {
            content: [{ type: 'text', text: 'Could not generate a spec from this data. The data may be empty or have no recognizable pattern.' }],
            isError: true,
          };
        }
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      } catch (err) {
        return errorResult(err);
      }
    },
  );

  return server;
}
