import assert from "node:assert/strict";
import test from "node:test";
import { handleBookRequest } from "../src/pages/api/book.js";

const ENV = { BWM_BOOK_INTAKE_KEY: "pages-book-test-key" };

function request(body = { submission_id: "example" }, options = {}) {
  return new Request(options.url || "https://buildwisemedia.com/api/book", {
    method: options.method || "POST",
    headers: {
      "Content-Type": options.contentType || "application/json",
      "Origin": options.origin || "https://buildwisemedia.com",
      "CF-Connecting-IP": options.ip || "203.0.113.14",
      "Authorization": "Bearer must-not-forward",
    },
    body: (options.method || "POST") === "GET"
      ? undefined
      : typeof body === "string" ? body : JSON.stringify(body),
  });
}

async function read(response) {
  return { status: response.status, body: await response.json(), headers: response.headers };
}

test("proxies one production submission through the dedicated secret-bound route", async () => {
  const originalFetch = globalThis.fetch;
  const calls = [];
  globalThis.fetch = async (url, init) => {
    calls.push({ url: String(url), init });
    return Response.json({
      ok: true,
      captured: true,
      emailed: true,
      receipt_recorded: true,
      submission_id: "1092f716-8f04-4cf7-9870-1d68632f5c8f",
    });
  };
  try {
    const result = await read(await handleBookRequest(
      request({ version: "bwm-fit-contact-v1" }),
      ENV,
    ));
    assert.equal(result.status, 200);
    assert.equal(result.body.emailed, true);
    assert.equal(result.headers.get("Cache-Control"), "no-store, private");
    assert.equal(calls.length, 1);
    assert.equal(
      calls[0].url,
      "https://bwm-form-handler.robert-ba0.workers.dev/buildwisemedia/fit-contact",
    );
    const headers = new Headers(calls[0].init.headers);
    assert.equal(headers.get("X-BWM-Book-Key"), "pages-book-test-key");
    assert.equal(headers.get("X-BWM-Visitor-IP"), "203.0.113.14");
    assert.equal(headers.get("Origin"), "https://buildwisemedia.com");
    assert.equal(headers.get("Authorization"), null);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("uses the Pages service binding so same-account Worker delivery cannot hit error 1042", async () => {
  const originalFetch = globalThis.fetch;
  let globalFetchCalled = false;
  globalThis.fetch = async () => {
    globalFetchCalled = true;
    throw new Error("global fetch must not be used when the service binding exists");
  };
  const calls = [];
  const env = {
    ...ENV,
    BWM_FORM_HANDLER: {
      async fetch(request) {
        calls.push(request);
        return Response.json({
          ok: true,
          captured: true,
          emailed: true,
          receipt_recorded: true,
          submission_id: "21fccebf-8508-450f-a1b2-1522bdb785fd",
        });
      },
    },
  };
  try {
    const result = await read(await handleBookRequest(request(), env));
    assert.equal(result.status, 200);
    assert.equal(globalFetchCalled, false);
    assert.equal(calls.length, 1);
    assert.equal(calls[0].url, "https://bwm-form-handler.robert-ba0.workers.dev/buildwisemedia/fit-contact");
    assert.equal(calls[0].headers.get("X-BWM-Book-Key"), "pages-book-test-key");
    assert.equal(await calls[0].json().then((body) => body.submission_id), "example");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("allows the exact Access-gated BWM review hostname", async () => {
  const originalFetch = globalThis.fetch;
  let called = false;
  globalThis.fetch = async () => {
    called = true;
    return Response.json({
      ok: true,
      captured: true,
      emailed: true,
      receipt_recorded: true,
      submission_id: "2ba9ee76-5b03-4fc0-b172-90f56f730758",
    });
  };
  try {
    const result = await read(await handleBookRequest(
      request({}, {
        url: "https://bwm-new-website-review.pages.dev/api/book",
        origin: "https://bwm-new-website-review.pages.dev",
      }),
      ENV,
    ));
    assert.equal(result.status, 200);
    assert.equal(result.body.emailed, true);
    assert.equal(called, true);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("rejects non-production origins and hosts without contacting upstream", async () => {
  const originalFetch = globalThis.fetch;
  let called = false;
  globalThis.fetch = async () => {
    called = true;
    return Response.json({ ok: true });
  };
  try {
    const wrongOrigin = await read(await handleBookRequest(
      request({}, { origin: "https://evil.example" }),
      ENV,
    ));
    assert.equal(wrongOrigin.status, 403);
    const previewHost = await read(await handleBookRequest(
      request({}, {
        url: "https://preview.pages.dev/api/book",
        origin: "https://buildwisemedia.com",
      }),
      ENV,
    ));
    assert.equal(previewHost.status, 403);
    const deploymentAlias = await read(await handleBookRequest(
      request({}, {
        url: "https://deadbeef.bwm-new-website-review.pages.dev/api/book",
        origin: "https://deadbeef.bwm-new-website-review.pages.dev",
      }),
      ENV,
    ));
    assert.equal(deploymentAlias.status, 403);
    assert.equal(called, false);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("fails closed when the site intake credential is not provisioned", async () => {
  const originalFetch = globalThis.fetch;
  let called = false;
  globalThis.fetch = async () => {
    called = true;
    return Response.json({ ok: true });
  };
  try {
    const result = await read(await handleBookRequest(request(), {}));
    assert.equal(result.status, 503);
    assert.deepEqual(result.body, { ok: false, emailed: false, error: "intake_not_configured" });
    assert.equal(called, false);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("rejects oversized bodies before contacting upstream", async () => {
  const originalFetch = globalThis.fetch;
  let called = false;
  globalThis.fetch = async () => {
    called = true;
    return Response.json({ ok: true });
  };
  try {
    const result = await read(await handleBookRequest(
      request(JSON.stringify({ value: "x".repeat(33 * 1024) })),
      ENV,
    ));
    assert.equal(result.status, 413);
    assert.equal(result.body.error, "payload_too_large");
    assert.equal(called, false);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("refuses a false-success upstream response", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => Response.json({ ok: true, captured: true, emailed: true, receipt_recorded: false });
  try {
    const result = await read(await handleBookRequest(request(), ENV));
    assert.equal(result.status, 502);
    assert.deepEqual(result.body, {
      ok: false,
      captured: true,
      emailed: true,
      receipt_recorded: false,
      retryable: true,
      error: "incomplete_intake_response",
    });
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("passes a captured email failure back to the page without calling it success", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => Response.json(
    { ok: false, captured: true, emailed: false, retryable: true, error: "email unavailable" },
    { status: 503 },
  );
  try {
    const result = await read(await handleBookRequest(request(), ENV));
    assert.equal(result.status, 503);
    assert.equal(result.body.ok, false);
    assert.equal(result.body.captured, true);
    assert.equal(result.body.emailed, false);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("allows POST only", async () => {
  const result = await read(await handleBookRequest(request({}, { method: "GET" }), ENV));
  assert.equal(result.status, 405);
  assert.equal(result.body.error, "method_not_allowed");
});
