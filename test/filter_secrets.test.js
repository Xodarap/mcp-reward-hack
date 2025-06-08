import { filterSecrets } from "../dist/filter_secrets.js";
import test from "node:test";
import assert from "node:assert";

test("filterSecrets", async (t) => {
  await t.test("should filter out secrets from the input object", async () => {
    const input = {
      messageHistory: [
        {
          role: "user",
          content: "token = ghp_123456789012345678901234567890123456",
        },
      ],
    };
    const result = await filterSecrets(input);
    assert.equal(result.messages.length, 1, "Finds GitHub token");
  });
});
