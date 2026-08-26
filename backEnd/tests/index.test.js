import assert from "node:assert/strict";
import test from "node:test";

import app from "../app.js";

const requestApp = async (path) => {
  return new Promise((resolve, reject) => {
    const response = {
      statusCode: 200,
      headers: {},
      setHeader(name, value) {
        this.headers[name.toLowerCase()] = value;
      },
      getHeader(name) {
        return this.headers[name.toLowerCase()];
      },
      removeHeader(name) {
        delete this.headers[name.toLowerCase()];
      },
      status(code) {
        this.statusCode = code;
        return this;
      },
      json(body) {
        resolve({
          status: this.statusCode,
          body,
        });
      },
    };

    app.handle(
      {
        method: "GET",
        url: path,
        originalUrl: path,
        headers: {},
      },
      response,
      reject
    );
  });
};

test("health endpoint reports the backend is available", async () => {
  const response = await requestApp("/api/v1/health");

  assert.equal(response.status, 200);
  assert.deepEqual(response.body, {
    status: "ok",
    service: "tenantcart-backend",
  });
});

test("unknown routes return 404", async () => {
  const response = await requestApp("/unknown-route");

  assert.equal(response.status, 404);
});
