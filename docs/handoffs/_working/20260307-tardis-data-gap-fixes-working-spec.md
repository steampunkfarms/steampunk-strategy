# Working Spec: DATA-FIX — Data Gap Fixes + Bulk Convert + MBOX Parser + Favicon

**Handoff ID:** `20260307-tardis-data-gap-fixes`
**Date:** 2026-03-07

## Strategy Session Template

1. **What is the business goal?** Close the data gap — Documents with parsed receipts need bulk conversion to Transactions. Historical Gmail receipts need capture. Analytics show $789 when actual spending is 10x+.
2. **Which repos are touched?** steampunk-strategy only.
3. **What data flows change?** Internal — populates Transaction table from parsed Documents and MBOX email exports.
4. **Who are the users?** Farm operator using TARDIS for financial management.
5. **What are the risks?** Low — additive features, dedup prevents data corruption. New dependency: mailparser.

## Cross-Site Impact Checklist

- [x] TARDIS (steampunk-strategy) — bulk convert, MBOX parser, Gmail backfill, favicon, gap audit
- [ ] Studiolo — not touched
- [ ] Postmaster — not touched
- [ ] Cleanpunk Shop — not touched
- [ ] Rescue Barn — not touched
- [ ] Orchestrator — not touched

## Family Planning Protocol Gate

- **Major Initiative?** No — single repo, operational tooling.
- **Novel Pattern?** No — extends existing document/transaction flow.
- **Gate result:** PASS — Tier 2 execution.

## Reversibility Score

- **Score:** HIGH
- **Rollback method:** Remove new files + revert documents page changes. No schema changes.
- **Data risk:** Low — dedup prevents duplicate transactions.

## Sanity Pass Findings

1. **create-transaction route:** 539 lines, contains all transaction creation logic inline. Needs extraction to shared function. CONFIRMED.
2. **Documents page:** Has document-uploader.tsx (single file upload) and likely a documents list/table. Need to find the list component for bulk select. CONFIRMED.
3. **Gmail receipt scan cron:** Exists at app/api/cron/gmail-receipt-scan/ — has vendor matching and financial query patterns to reuse. CONFIRMED.
4. **TransactionDocument model:** Join table linking Transaction to Document. Used for dedup check. CONFIRMED.
5. **mailparser:** npm package for parsing MBOX/EML files. Needs install. CONFIRMED.
