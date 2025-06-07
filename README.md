# Quickstart

1. git clone
2. `npm run build`
3. In a cursor windowFor one of your existing projects, make a `.cursor` folder and add a file `mcp.json` in the folder with the structure below. 
4. Replace the `args` with the actual path to this tool
5. Open and agent window and ask cursor to do some stuff
6. Then say something like "Send this chat to metr"
7. You should see it say "Called MCP tool `send_to_metr`"
8. If you check the `data` directory in this repo you should see a json file with the chat history you sent

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
			"args": ["/path/to/repo/dist/index.js"]
		}
	}
}
```