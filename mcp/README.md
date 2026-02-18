# @iyulab/u-widgets-mcp

MCP (Model Context Protocol) server for the [u-widgets](https://github.com/iyulab/u-widgets) declarative widget system.

Exposes u-widgets' developer tools as MCP tools, enabling AI assistants to create, validate, and suggest data-driven widget specs.

## Tools

| Tool | Description |
|------|-------------|
| `help` | List available widget types. Filter by name or category. |
| `template` | Generate a minimal, valid widget spec with sample data. |
| `validate` | Check a widget spec for errors and warnings. |
| `suggest_mapping` | Analyze data and suggest the best widget type + mapping. |
| `auto_spec` | Generate a complete spec from raw data (one-call convenience). |

## Installation

```bash
npm install -g @iyulab/u-widgets-mcp
```

Or run directly with npx:

```bash
npx @iyulab/u-widgets-mcp
```

## Configuration

### Claude Desktop

Add to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "u-widgets": {
      "command": "npx",
      "args": ["-y", "@iyulab/u-widgets-mcp"]
    }
  }
}
```

### Claude Code

Add to your `.claude/settings.json` or project `.mcp.json`:

```json
{
  "mcpServers": {
    "u-widgets": {
      "command": "npx",
      "args": ["-y", "@iyulab/u-widgets-mcp"]
    }
  }
}
```

### VS Code (Copilot)

Add to `.vscode/mcp.json`:

```json
{
  "servers": {
    "u-widgets": {
      "command": "npx",
      "args": ["-y", "@iyulab/u-widgets-mcp"]
    }
  }
}
```

## Tool Examples

### help

```
List all widget types:
→ help()

List chart types only:
→ help({ widget: "chart" })

Get details for a specific widget:
→ help({ widget: "chart.bar" })
```

### template

```
Generate a bar chart template:
→ template({ widget: "chart.bar" })

Result:
{
  "widget": "chart.bar",
  "data": [{ "category": "A", "value": 30 }, ...],
  "mapping": { "x": "category", "y": "value" }
}
```

### validate

```
Check if a spec is valid:
→ validate({ spec: { "widget": "metric", "data": { "value": 42 } } })

Result:
{ "valid": true, "errors": [], "warnings": [] }
```

### suggest_mapping

```
Get widget suggestions for your data:
→ suggest_mapping({ data: [{ "name": "A", "value": 30 }, { "name": "B", "value": 70 }] })

Result:
[
  { "widget": "chart.bar", "confidence": 0.9, "mapping": { "x": "name", "y": "value" }, ... },
  { "widget": "chart.line", ... },
  ...
]
```

### auto_spec

```
Generate a complete spec from data:
→ auto_spec({ data: [{ "quarter": "Q1", "revenue": 100 }, { "quarter": "Q2", "revenue": 150 }] })

Result:
{
  "widget": "chart.bar",
  "data": [{ "quarter": "Q1", "revenue": 100 }, ...],
  "mapping": { "x": "quarter", "y": "revenue" }
}
```

## Development

```bash
cd mcp

# Install dependencies
npm install

# Run in development mode
npm run dev

# Run tests
npm test

# Build
npm run build

# Interactive testing with MCP Inspector
npm run inspect
```

## License

MIT
