#!/usr/bin/env node
// Root-level wrapper for verify-handoff.mjs
// Delegates to scripts/verify-handoff.mjs for command compatibility.
// Both `node verify-handoff.mjs` and `node scripts/verify-handoff.mjs` work.
import './scripts/verify-handoff.mjs';
