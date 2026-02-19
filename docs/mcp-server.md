# MCP Server Guide

u-widgets provides an [MCP (Model Context Protocol)](https://modelcontextprotocol.io/) server that exposes widget tools to AI assistants. This allows LLMs to create, validate, and suggest widget specs.

## Package

```
@iyulab/u-widgets-mcp
```

Separate npm package located in the [`mcp/`](../mcp/) directory of this repository.

## Tools

| Tool | Description |
|------|-------------|
| `help` | List available widget types. Filter by name or category. |
| `template` | Generate a minimal, valid widget spec with sample data. |
| `validate` | Check a widget spec for errors and warnings. |
| `suggest_mapping` | Analyze data and suggest the best widget type + mapping. |
| `auto_spec` | Generate a complete spec from raw data (one-call). |

## Setup

### Claude Desktop

Edit `claude_desktop_config.json`:

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

Config file location:
- macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
- Windows: `%APPDATA%\Claude\claude_desktop_config.json`

### Claude Code

Add to project `.mcp.json` or `~/.claude/settings.json`:

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

### Cursor

Add to `.cursor/mcp.json`:

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

## Usage Examples

Setup 후 AI assistant에게 자연어로 요청하면 됩니다:

> "이 데이터를 차트로 보여줘" → `auto_spec` 호출
> "u-widgets에 어떤 위젯이 있어?" → `help` 호출
> "metric 위젯 예시 만들어줘" → `template` 호출
> "이 spec이 맞는지 확인해줘" → `validate` 호출

### Tool Responses

```
→ help({ widget: "chart" })
  [{ widget: "chart.bar", ... }, { widget: "chart.line", ... }, ...]

→ template({ widget: "metric" })
  { "widget": "metric", "data": { "value": 1284, "unit": "users", ... } }

→ auto_spec({ data: [{ "name": "A", "value": 30 }, { "name": "B", "value": 70 }] })
  { "widget": "chart.bar", "data": [...], "mapping": { "x": "name", "y": "value" } }

→ validate({ spec: { "widget": "metric", "data": { "value": 42 } } })
  { "valid": true, "errors": [], "warnings": [] }
```

## Deployment

MCP server는 별도 npm 패키지(`@iyulab/u-widgets-mcp`)로 배포됩니다.

- **사용자 입장**: `npx @iyulab/u-widgets-mcp`로 설치 없이 실행
- **전역 설치**: `npm install -g @iyulab/u-widgets-mcp`
- **배포**: `mcp/` 디렉토리에서 `npm publish` (GitHub Actions 자동화)

### Publish Workflow

`package.json` 변경 시 GitHub Actions가 자동으로 npm에 배포합니다. 수동 트리거도 가능합니다.

## Development

```bash
cd mcp
npm install
npm run dev          # Development mode (tsx)
npm run build        # Build
npm test             # Run tests
npm run inspect      # MCP Inspector로 대화형 테스트
```

## Architecture

```
mcp/
  src/
    index.ts      # Entry point (stdio transport)
    server.ts     # MCP server (tool definitions)
  package.json    # @iyulab/u-widgets-mcp
```

The server imports `@iyulab/u-widgets/tools` and wraps each function as an MCP tool with JSON Schema validation via Zod.
