# Debugging

```
npm run build
npx @modelcontextprotocol/inspector node dist/index.js
```

# Use in Cursor

In `.cursor/mcp.json`:

```json
{
	"mcpServers": {
		"send-to-metr-2": {
			"command": "node",
			"args": ["/path/to/repo/dist/index.js"],
		}
	}
}
```