#!/usr/bin/env node

const crypto = require("crypto");

const apiUrl = process.env.API_URL || "http://localhost:4000/api/leads/public";
const total = Number(process.env.CONCURRENCY || process.argv[2] || 100);
const batchId = process.env.BATCH_ID || crypto.randomUUID();

function payload(index) {
  const pickup = new Date(Date.now() + 24 * 60 * 60 * 1000 + index * 60_000).toISOString();
  const drop = new Date(Date.now() + 48 * 60 * 60 * 1000 + index * 60_000).toISOString();

  return {
    pickup_location: `Stress pickup ${batchId}-${index}`,
    drop_location: `Stress drop ${batchId}-${index}`,
    pickup_datetime: pickup,
    return_datetime: drop,
    customer_name: `Stress User ${index}`,
    customer_email: `stress+${batchId}-${index}@fleetnexus.test`,
    customer_phone: `90000${String(index).padStart(5, "0")}`,
  };
}

async function submit(index) {
  const requestId = `stress-${batchId}-${index}`;
  const idempotencyKey = `lead-${batchId}-${index}`;
  const startedAt = Date.now();

  try {
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Idempotency-Key": idempotencyKey,
        "X-Request-Id": requestId,
      },
      body: JSON.stringify(payload(index)),
    });
    const body = await response.json().catch(() => ({}));

    return {
      ok: response.ok,
      status: response.status,
      leadId: body.leadId,
      body,
      durationMs: Date.now() - startedAt,
    };
  } catch (error) {
    return {
      ok: false,
      status: 0,
      error: error instanceof Error ? error.message : String(error),
      durationMs: Date.now() - startedAt,
    };
  }
}

async function main() {
  console.log(JSON.stringify({ event: "stress.start", apiUrl, total, batchId }));
  const startedAt = Date.now();
  const results = await Promise.all(Array.from({ length: total }, (_, index) => submit(index)));
  const successes = results.filter((result) => result.ok);
  const failures = results.filter((result) => !result.ok);
  const leadIds = successes.map((result) => result.leadId).filter(Boolean);
  const duplicateLeadIds = leadIds.filter((leadId, index) => leadIds.indexOf(leadId) !== index);
  const durations = results.map((result) => result.durationMs).sort((a, b) => a - b);
  const p95 = durations[Math.floor(durations.length * 0.95)] || 0;

  console.log(
    JSON.stringify(
      {
        event: "stress.complete",
        total,
        successCount: successes.length,
        failureCount: failures.length,
        uniqueLeadIds: new Set(leadIds).size,
        duplicateLeadIds: [...new Set(duplicateLeadIds)],
        p95Ms: p95,
        durationMs: Date.now() - startedAt,
      },
      null,
      2,
    ),
  );

  if (failures.length) {
    console.error(JSON.stringify({ event: "stress.failures", failures: failures.slice(0, 10) }, null, 2));
  }

  if (failures.length || duplicateLeadIds.length || leadIds.length !== total) {
    process.exitCode = 1;
  }
}

void main();
