# Quickstart

1. git clone
2. `npm run build`
3. In a cursor window for one of your existing projects, make a `.cursor` folder and add a file `mcp.json` in the folder [like this](#use-in-cursor). 
4. Replace the `args` with the actual path to this tool

# Usage

1. Open an agent window and ask cursor to do some stuff
2. Then say something like "Send chat history to metr"
3. You should see it say "Called MCP tool `send_to_metr`"
4. The report will be posted to the configured URL

# Configuration

Set the required environment variables in your MCP configuration.

Required environment variables:
- `METR_URL` - The upload function URL where reports will be posted
- `API_KEY` - Your API key for authentication

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
			"args": ["/REPLACE_ME_WITH/path/to/repo/dist/index.js"],
			"env": {
				"METR_URL": "https://your-upload-function-url",
				"API_KEY": "your-api-key"
			}
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
			"args": ["/REPLACE_ME_WITH/path/to/repo/dist/index.js"],
			"env": {
				"METR_URL": "https://your-upload-function-url",
				"API_KEY": "your-api-key"
			}
		}
	}
}
```