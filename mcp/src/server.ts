import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { help, template, suggestMapping, autoSpec } from '@iyulab/u-widgets/tools';
import { validate } from '@iyulab/u-widgets';

type ToolResult = { content: Array<{ type: 'text'; text: string }>; isError?: boolean };

function errorResult(err: unknown): ToolResult {
  const msg = err instanceof Error ? err.message : String(err);
  return { content: [{ type: 'text', text: `Internal error: ${msg}` }], isError: true };
}

/**
 * Create and configure the u-widgets MCP server.
 *
 * Returns a configured McpServer instance without connecting
 * to any transport — the caller is responsible for connecting.
 */
export function createServer(): McpServer {
  const server = new McpServer({
    name: 'u-widgets-mcp',
    version: '0.1.0',
  });

  // ── Tool: help ──────────────────────────────────────────────
  server.tool(
    'help',
    'List available u-widget types. Returns the full catalog when no argument is given, or filters by widget name or category (e.g. "chart", "chart.bar", "display").',
    { widget: z.string().max(100).optional().describe('Widget type or category to filter (e.g. "chart.bar", "chart", "display"). Omit for full catalog.') },
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
  server.tool(
    'template',
    'Generate a minimal, valid u-widget spec with sample data for a given widget type. Use this as a starting point when creating widgets.',
    { widget: z.string().max(100).describe('Widget type (e.g. "metric", "chart.bar", "table", "form").') },
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
  server.tool(
    'validate',
    'Validate a u-widget spec. Returns errors (fatal) and warnings (non-fatal). Use this to check if a spec is correct before rendering.',
    { spec: z.record(z.unknown()).describe('The u-widget spec object to validate. Must be a plain object with a "widget" field.') },
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
  server.tool(
    'suggest_mapping',
    'Analyze data and suggest the best widget type with auto-inferred mapping. Returns ranked suggestions sorted by confidence. Optionally constrain to a specific widget type.',
    {
      data: z.union([z.record(z.unknown()), z.array(z.record(z.unknown()))]).describe('The data to analyze — a single object or an array of records.'),
      widget: z.string().max(100).optional().describe('Optional widget type to constrain the suggestion (e.g. "chart.pie"). Must be a known widget type from the catalog.'),
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
  server.tool(
    'auto_spec',
    'Generate a complete, ready-to-use u-widget spec from raw data. Picks the best widget type and mapping automatically. One-call convenience for quick visualizations.',
    { data: z.union([z.record(z.unknown()), z.array(z.record(z.unknown()))]).describe('The data to visualize — a single object or an array of records.') },
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
