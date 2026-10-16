import test from "node:test";
import assert from "node:assert/strict";
import { Packer } from "docx";
import { DEFAULT_PROFILE } from "../api/_lib/profile.js";
import { GOOD_RESUME } from "./fixture.js";

test("DOCX builds from a resume", async () => {
  // buildDocx returns a Blob in the browser; in Node, Packer.toBlob also works on 18+
  const { buildDocx } = await import("../src/lib/exportDocx.js");
  const blob = await buildDocx(GOOD_RESUME, DEFAULT_PROFILE, 10.5);
  assert.ok(blob.size > 5000);
  assert.ok(Packer);
});
