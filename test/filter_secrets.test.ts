import { filterSecrets } from "../dist/filter_secrets.js";
import test from "node:test";
import assert from "node:assert";

test("filterSecrets", async (t) => {
  await t.test("should filter out secrets from the input object", async () => {
    const input = {
      messageHistory: [
        {
          role: "user" as "user",
          content: "token = ghp_123456789012345678901234567890123456",
          timestamp: new Date().toISOString(),
        },
      ],
      edits: [
        {
          originalContent:
            "OpenAI API key: sk-12345678901234567890T3BlbkFJ12345678901234567890",
          editedContent: "npm auth: https://abcd123:x-oauth-basic@github.com/",
          editType: "user_edit" as "user_edit",
          timestamp: new Date().toISOString(),
          messageId: "edit-123",
        },
      ],
      sessionId: "session-123",
      timestamp: new Date().toISOString(),
    };
    const result = await filterSecrets(input);
    assert.equal(
      result.messages.length,
      3,
      "Finds GitHub, OpenAI, and NPM secrets"
    );
  });
});
