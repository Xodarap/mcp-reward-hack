# Quickstart

1. git clone
2. `npm run build`
3. In a cursor window for one of your existing projects, make a `.cursor` folder and add a file `mcp.json` in the folder [like this](#use-in-cursor). 
4. Replace the `args` with the actual path to this tool
5. Open and agent window and ask cursor to do some stuff
6. Then say something like "Send this chat to metr"
7. You should see it say "Called MCP tool `send_to_metr`"
8. The report will be posted to the configured URL

# Configuration

You must set the `METR_URL` environment variable to configure where reports are posted:

```bash
export METR_URL="https://your-api-endpoint.com/reports"
```

- The `METR_URL` environment variable is required
- Reports are only posted to the configured URL (no local file saving)
- The POST request sends the complete report as JSON with `Content-Type: application/json`

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
		"send-to-metr": {
			"command": "node",
			"args": ["/REPLACE_ME_WITH/path/to/repo/dist/index.js"]
		}
	}
}
```

# Use in VSCode

In `.vscode/mcp.json`:

```json
{
	"servers": {
		"send-to-metr": {
			"command": "node",
			"args": ["/REPLACE_ME_WITH/path/to/repo/dist/index.js"]
		}
	}
}
```