import http from "k6/http";
import { check, group, sleep } from "k6";
import { Trend, Rate } from "k6/metrics";

const endpoints = JSON.parse(open("../data/endpoints.json"));

const BASE_URL = __ENV.BASE_URL || "http://host.docker.internal:8000";
const AUTH_EMAIL = __ENV.AUTH_EMAIL || "";
const AUTH_PASSWORD = __ENV.AUTH_PASSWORD || "";

const responseTime = new Trend("maka_response_time");
const errorRate = new Rate("maka_error_rate");

export const options = {
  scenarios: {
    smoke: {
      executor: "constant-vus",
      vus: Number(__ENV.VUS || 5),
      duration: __ENV.DURATION || "1m"
    }
  },
  thresholds: {
    http_req_failed: ["rate<0.05"],
    http_req_duration: ["p(95)<1000"],
    maka_error_rate: ["rate<0.05"],
    maka_response_time: ["p(95)<1000"]
  }
};

function expectedStatusMatches(res, expectedStatus) {
  if (Array.isArray(expectedStatus)) {
    return expectedStatus.includes(res.status);
  }
  return res.status === expectedStatus;
}

function extractToken(res) {
  let token = "";

  try {
    const body = res.json();
    token = body.token || body.access_token || body.jwt || "";
  } catch (_) {
    token = "";
  }

  return token;
}

function endpointUrl(endpoint) {
  return endpoint.url || `${BASE_URL}${endpoint.path}`;
}

function requestEndpoint(endpoint, params = {}) {
  const body = endpoint.body ? JSON.stringify(endpoint.body) : null;
  const headers = Object.assign(
    endpoint.body ? { "Content-Type": "application/json" } : {},
    params.headers || {}
  );

  return http.request(endpoint.method, endpointUrl(endpoint), body, {
    ...params,
    headers
  });
}

function login() {
  if (!AUTH_EMAIL || !AUTH_PASSWORD) {
    return { token: "", status: 0 };
  }

  const res = http.post(
    `${BASE_URL}/api/auth/login`,
    JSON.stringify({ email: AUTH_EMAIL, password: AUTH_PASSWORD }),
    { headers: { "Content-Type": "application/json" } }
  );

  responseTime.add(res.timings.duration);
  errorRate.add(res.status !== 200);

  check(res, {
    "auth_login status 200": (r) => r.status === 200,
    "auth_login token received": (r) => extractToken(r).length > 0
  });

  return { token: extractToken(res), status: res.status };
}

export default function () {
  const auth = login();

  group("public endpoints", () => {
    for (const endpoint of endpoints.publicEndpoints) {
      const res = requestEndpoint(endpoint);
      responseTime.add(res.timings.duration);
      errorRate.add(!expectedStatusMatches(res, endpoint.expectedStatus));

      check(res, {
        [`${endpoint.name} status ${endpoint.expectedStatus}`]: (r) =>
          expectedStatusMatches(r, endpoint.expectedStatus)
      });
    }
  });

  if (auth.token) {
    group("authenticated endpoints", () => {
      const params = {
        headers: {
          Authorization: `Bearer ${auth.token}`
        }
      };

      for (const endpoint of endpoints.authenticatedEndpoints) {
        const res = requestEndpoint(endpoint, params);
        responseTime.add(res.timings.duration);
        errorRate.add(!expectedStatusMatches(res, endpoint.expectedStatus));

        check(res, {
          [`${endpoint.name} status ${endpoint.expectedStatus}`]: (r) =>
            expectedStatusMatches(r, endpoint.expectedStatus)
        });
      }
    });
  }

  sleep(1);
}
