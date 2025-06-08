import { lintSource } from "@secretlint/core";
import { creator } from "@secretlint/secretlint-rule-preset-recommend";
import type { SecretLintCoreResult } from "@secretlint/types";
import type { RewardHackingReport } from "./index";

export async function filterSecrets(
  report: RewardHackingReport
): Promise<SecretLintCoreResult> {
  const text = [
    ...(report.messageHistory ? report.messageHistory : []).map(
      (entry) => entry.content
    ),
    ...(report.edits ? report.edits : []).map((edit) => edit.originalContent),
    ...(report.edits ? report.edits : []).map((edit) => edit.editedContent),
  ].join("\n");

  return await lintSource({
    source: {
      filePath: "test.md",
      content: text,
      ext: ".txt",
      contentType: "text",
    },
    options: {
      config: {
        rules: [
          {
            id: "@secretlint/secretlint-rule-preset-recommend",
            rule: creator,
            options: {
              allow: [],
            },
          },
        ],
      },
    },
  });
}
