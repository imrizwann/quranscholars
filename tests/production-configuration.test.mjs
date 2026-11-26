import test from "node:test";
import process from "node:process";
import assert from "node:assert/strict";
import { build } from "vite";
import { validatePublicEnvironment } from "../scripts/public-environment.mjs";

const valid = { VITE_API_URL: "https://api.example.test", VITE_PUBLIC_SITE_URL: "https://frontend.example.test" };
test("builds cannot include development-only routes through a NODE_ENV override", async t => {
  const previous = process.env.NODE_ENV; process.env.NODE_ENV = "development";
  t.after(() => { if (previous === undefined) delete process.env.NODE_ENV; else process.env.NODE_ENV = previous; });
  await assert.rejects(build({ logLevel: "silent", build: { write: false } }), /Frontend builds require NODE_ENV=production/);
});

test("release configuration requires secure explicit API and canonical origins", () => {
  validatePublicEnvironment(valid);
  validatePublicEnvironment({ ...valid, VITE_API_URL: "/", VITE_REALTIME_URL: "wss://api.example.test", VITE_COURSE_MEDIA_BASE_URL: "https://media.example.test/public" });
  for (const name of ["VITE_API_URL", "VITE_PUBLIC_SITE_URL"]) {
    for (const value of [undefined, "", "http://localhost:3000", "//api.example.test", "https://user:private-value@example.test", "https://example.test/api", "https://example.test?token=private-value", "https://example.test#private-value"]) {
      assert.throws(() => validatePublicEnvironment({ ...valid, [name]: value }), error => {
        assert(error.message.startsWith(name)); assert(!error.message.includes("private-value")); return true;
      });
    }
  }
  for (const name of ["VITE_JWT_SECRET", "VITE_REDIS_PASSWORD", "VITE_RESEND_API_KEY", "VITE_RAZORPAY_KEY_SECRET", "VITE_GOOGLE_CLIENT_SECRET"]) {
    assert.throws(() => validatePublicEnvironment({ ...valid, [name]: "private-value" }), error => {
      assert(error.message.includes(name)); assert(!error.message.includes("private-value")); return true;
    });
  }
  assert.throws(() => validatePublicEnvironment({ ...valid, VITE_REALTIME_URL: "ws://api.example.test" }), /VITE_REALTIME_URL/);
  assert.throws(() => validatePublicEnvironment({ ...valid, VITE_COURSE_MEDIA_BASE_URL: "https://media.example.test?key=private" }), /VITE_COURSE_MEDIA_BASE_URL/);
});

test("home hero layout flag accepts only the supported layouts", () => {
  for (const value of ["", "current", "video", "path", "editorial"]) validatePublicEnvironment({ ...valid, VITE_HOME_HERO_LAYOUT: value });
  for (const value of ["split", "Video", "stage", "carousel"]) {
    assert.throws(() => validatePublicEnvironment({ ...valid, VITE_HOME_HERO_LAYOUT: value }), /VITE_HOME_HERO_LAYOUT must be current, video, path or editorial/);
  }
});

test("Google configuration accepts only a public Web client ID", () => {
  validatePublicEnvironment({ ...valid, VITE_GOOGLE_CLIENT_ID: "123-public.apps.googleusercontent.com" });
  validatePublicEnvironment({ ...valid, VITE_GOOGLE_CLIENT_ID: "" });
  assert.throws(() => validatePublicEnvironment({ ...valid, VITE_GOOGLE_CLIENT_ID: "GOCSPX-private-value" }), error => {
    assert.match(error.message, /client ID/); assert(!error.message.includes("private-value")); return true;
  });
});

test("real production bundles exclude backend credentials, development routes and source maps", { timeout: 120_000 }, async t => {
  const secrets = { JWT_SECRET: "bundle-test-jwt-private-sentinel", REDIS_PASSWORD: "bundle-test-redis-private-sentinel", RESEND_API_KEY: "bundle-test-mail-private-sentinel", GOOGLE_CLIENT_SECRET: "bundle-test-google-private-sentinel" };
  const values = { ...valid, ...secrets, VITE_GOOGLE_CLIENT_ID: "123-public.apps.googleusercontent.com", NODE_ENV: "production" };
  for (const [name, value] of Object.entries(values)) {
    const previous = process.env[name]; process.env[name] = value;
    t.after(() => { if (previous === undefined) delete process.env[name]; else process.env[name] = previous; });
  }
  const result = await build({ logLevel: "silent", build: { write: false } });
  const output = result.output;
  const text = output.map(item => item.type === "chunk" ? item.code : typeof item.source === "string" ? item.source : "").join("\n");
  for (const secret of Object.values(secrets)) assert(!text.includes(secret));
  assert(text.includes(valid.VITE_API_URL));
  const html = output.find(item => item.fileName === "index.html").source;
  assert(html.includes(`${valid.VITE_PUBLIC_SITE_URL}/og-image.png`));
  assert(!html.includes("%VITE_"));
  assert(!output.some(item => item.fileName.endsWith(".map")));
  for (const item of output.filter(item => item.type === "chunk")) {
    for (const [name, metadata] of Object.entries(item.modules)) {
      if (/pages\/dev\/TestPage|example themes|DevelopmentWelcome/.test(name)) assert.equal(metadata.renderedLength, 0, name);
    }
  }
});
