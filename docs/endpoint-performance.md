# Endpoint baseline — 25 September 2026

Three sequential authenticated GET requests per endpoint, measured from the development machine to the configured deployed backend. Times include network transit, application/authentication, database work and body download. All returned HTTP 200. These are a small baseline, not a load test or isolated database timings; the first sample is not necessarily a cold start.

| Backend path (under `/api`)    | Total time samples (ms) | Median (ms) | Response bytes |
| ------------------------------ | ----------------------- | ----------- | -------------- |
| `/questionset`                 | 1084, 944, 922          | 944         | 4,414          |
| `/quiz`                        | 1815, 1777, 1733        | 1777        | 234,516        |
| `/quiz/slim`                   | 1531, 1786, 1581        | 1581        | 134,147        |
| `/admin/quiztakers?limit=1000` | 1313, 1049, 1115        | 1115        | 71             |
| `/admin/submissions`           | 1129, 1124, 1091        | 1124        | 72             |
| `/admin/content`               | 1572, 1232, 1063        | 1232        | 18,550         |
| `/attendance/admin/schedules`  | 1359, 1339, 1344        | 1344        | 25,474         |

The student/submission responses were tiny, so this run does not establish performance with populated or large datasets. Most elapsed time was before response headers arrived. The full quiz list spent another 180–229 ms receiving its body; smaller payloads may help, but network, authentication and database timings need separating before attributing the main delay.

## Changes made

- Schedules uses the all-department data already supplied by the server. Opening the page no longer issues a second schedule GET; switching departments does not fetch again.
- Saving a schedule updates the screen from the successful POST response instead of following it with another GET.
- An explicit Refresh schedules button fetches current data from the server. Failed refreshes leave the existing data in place.
- Student actions no longer call `router.refresh()` after already updating local state or fetching the refreshed student list.

These changes remove unnecessary requests; they do not claim to shorten individual backend responses. Updated frontend deployment is required. Other administrators' schedule changes become visible on explicit refresh or reopening the page.

## Repeat the measurement

Run `node scripts/benchmark-endpoints.cjs` from the frontend project with `BENCHMARK_ADMIN_EMAIL` and `BENCHMARK_ADMIN_PASSWORD`, or `BENCHMARK_TOKEN`, supplied through the environment. Optional command arguments select backend-relative paths. The script emits timing/size metadata only; credentials and response bodies are not written to disk.

Next investigation: compare frontend/backend/database regions and add separate authentication/query timings. Large-list pagination and leaderboard aggregation should be evaluated with representative populated data before changing those workflows.
