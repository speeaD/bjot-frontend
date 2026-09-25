// Run with BENCHMARK_ADMIN_EMAIL and BENCHMARK_ADMIN_PASSWORD (or BENCHMARK_TOKEN).
// Prints only timing/size metadata. Credentials and response bodies stay in memory.
require("@next/env").loadEnvConfig(process.cwd());

async function main() {
  const base = process.env.BACKEND_URL?.replace(/\/$/, "");
  if (!base) throw new Error("BACKEND_URL is required");
  let token = process.env.BENCHMARK_TOKEN;
  if (!token) {
    if (
      !process.env.BENCHMARK_ADMIN_EMAIL ||
      !process.env.BENCHMARK_ADMIN_PASSWORD
    )
      throw new Error("Provide benchmark login credentials or BENCHMARK_TOKEN");
    const login = await fetch(`${base}/auth/admin/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: process.env.BENCHMARK_ADMIN_EMAIL,
        password: process.env.BENCHMARK_ADMIN_PASSWORD,
      }),
      signal: AbortSignal.timeout(30000),
    });
    if (!login.ok) throw new Error(`Login failed (${login.status})`);
    token = (await login.json()).token;
    if (!token) throw new Error("Login did not return a token");
  }
  const endpoints =
    process.argv.length > 2
      ? process.argv.slice(2)
      : [
          "/questionset",
          "/quiz",
          "/quiz/slim",
          "/admin/quiztakers?limit=1000",
          "/admin/submissions",
          "/admin/content",
          "/attendance/admin/schedules",
        ];
  if (endpoints.some((path) => !path.startsWith("/") || path.startsWith("//")))
    throw new Error("Use backend-relative endpoint paths");
  for (const path of endpoints) {
    const samples = [];
    for (let round = 0; round < 3; round++) {
      const start = performance.now();
      const response = await fetch(base + path, {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
        signal: AbortSignal.timeout(30000),
      });
      const headersMs = Math.round(performance.now() - start);
      const body = await response.arrayBuffer();
      samples.push({
        status: response.status,
        headersMs,
        totalMs: Math.round(performance.now() - start),
        bytes: body.byteLength,
      });
    }
    console.log(JSON.stringify({ endpoint: path, samples }));
  }
}
main().catch((error) => {
  console.error(
    error.name === "TimeoutError"
      ? "Benchmark request timed out"
      : error.message,
  );
  process.exitCode = 1;
});
