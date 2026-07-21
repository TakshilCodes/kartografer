import assert from "node:assert/strict";
import test from "node:test";

import { getRetryAiErrorMessage } from "../lib/ai/ai-error-details";

test("retry generation errors identify the failed long-trip day range", () => {
  const error = Object.assign(
    new Error("AI failed while generating days 13-14: model unavailable"),
    { status: 503 },
  );

  assert.match(
    getRetryAiErrorMessage(error),
    /day 13-14 section could not be generated/i,
  );
});
