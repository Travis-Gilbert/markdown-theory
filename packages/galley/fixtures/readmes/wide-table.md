# wide-table

A table with more columns than the measure can hold. It must scroll inside its own container, not
widen the page.

| id  | name          | region     | status   | latency_ms | throughput | error_rate | version | owner    | updated    |
| --- | ------------- | ---------- | -------- | ---------- | ---------- | ---------- | ------- | -------- | ---------- |
| 1   | alpha-service | us-east-1  | healthy  | 12         | 9800       | 0.001      | 2.14.0  | platform | 2026-07-01 |
| 2   | beta-ingest   | eu-west-2  | degraded | 340        | 1200       | 0.042      | 0.9.7   | data     | 2026-06-28 |
| 3   | gamma-render  | ap-south-1 | healthy  | 27         | 4400       | 0.003      | 11.0.1  | frontend | 2026-07-04 |

Text after the table should return to the normal measure.
