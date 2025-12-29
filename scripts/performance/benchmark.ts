import autocannon from 'autocannon';
import { createAPIGateway } from '../src/lib/api/gateway';

interface BenchmarkResult {
  endpoint: string;
  requests: number;
  duration: number;
  latency: {
    mean: number;
    p50: number;
    p95: number;
    p99: number;
  };
  throughput: number;
  errors: number;
}

async function runBenchmark(
  url: string,
  options: autocannon.Options
): Promise<BenchmarkResult> {
  return new Promise((resolve, reject) => {
    autocannon(
      {
        url,
        ...options,
      },
      (err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve({
            endpoint: url,
            requests: result.requests.total,
            duration: result.duration,
            latency: {
              mean: result.latency.mean,
              p50: result.latency.p50,
              p95: result.latency.p95,
              p99: result.latency.p99,
            },
            throughput: result.throughput.mean,
            errors: result.errors,
          });
        }
      }
    );
  });
}

async function main() {
  console.log('🚀 Starting Performance Benchmarks...
');

  const baseURL = process.env.BENCHMARK_URL || 'http://localhost:3000';
  const benchmarks: BenchmarkResult[] = [];

  // Benchmark 1: Health Check
  console.log('📊 Benchmarking /health endpoint...');
  const healthResult = await runBenchmark(`${baseURL}/health`, {
    connections: 100,
    duration: 10,
    pipelining: 10,
  });
  benchmarks.push(healthResult);
  console.log(`  Requests: ${healthResult.requests.toLocaleString()}`);
  console.log(`  Throughput: ${healthResult.throughput.toLocaleString()} req/sec`);
  console.log(`  Latency (p95): ${healthResult.latency.p95}ms
`);

  // Benchmark 2: Authentication
  console.log('📊 Benchmarking /auth/login endpoint...');
  const authResult = await runBenchmark(`${baseURL}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: 'test@example.com',
      password: 'password123',
    }),
    connections: 50,
    duration: 10,
  });
  benchmarks.push(authResult);
  console.log(`  Requests: ${authResult.requests.toLocaleString()}`);
  console.log(`  Throughput: ${authResult.throughput.toLocaleString()} req/sec`);
  console.log(`  Latency (p95): ${authResult.latency.p95}ms
`);

  // Benchmark 3: Authenticated Endpoint
  console.log('📊 Benchmarking authenticated API endpoint...');
  const token = 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'; // Get real token
  const apiResult = await runBenchmark(`${baseURL}/api/calls`, {
    headers: {
      Authorization: token,
    },
    connections: 100,
    duration: 10,
  });
  benchmarks.push(apiResult);
  console.log(`  Requests: ${apiResult.requests.toLocaleString()}`);
  console.log(`  Throughput: ${apiResult.throughput.toLocaleString()} req/sec`);
  console.log(`  Latency (p95): ${apiResult.latency.p95}ms
`);

  // Summary
  console.log('
📈 BENCHMARK SUMMARY');
  console.log('='.repeat(80));
  
  const totalRequests = benchmarks.reduce((sum, b) => sum + b.requests, 0);
  const avgThroughput = benchmarks.reduce((sum, b) => sum + b.throughput, 0) / benchmarks.length;
  const avgLatencyP95 = benchmarks.reduce((sum, b) => sum + b.latency.p95, 0) / benchmarks.length;

  console.log(`Total Requests:        ${totalRequests.toLocaleString()}`);
  console.log(`Average Throughput:    ${avgThroughput.toLocaleString()} req/sec`);
  console.log(`Average Latency (p95): ${avgLatencyP95.toFixed(2)}ms`);
  console.log(`Total Errors:          ${benchmarks.reduce((sum, b) => sum + b.errors, 0)}`);

  // Performance Thresholds
  console.log('
🎯 PERFORMANCE THRESHOLDS');
  console.log('='.repeat(80));
  
  const thresholds = {
    throughput: 1000, // req/sec
    latencyP95: 100, // ms
    errorRate: 0.01, // 1%
  };

  const avgErrorRate = benchmarks.reduce((sum, b) => sum + (b.errors / b.requests), 0) / benchmarks.length;

  console.log(`Throughput:     ${avgThroughput >= thresholds.throughput ? '✅' : '❌'} ${avgThroughput.toFixed(0)} / ${thresholds.throughput} req/sec`);
  console.log(`Latency (p95):  ${avgLatencyP95 <= thresholds.latencyP95 ? '✅' : '❌'} ${avgLatencyP95.toFixed(2)} / ${thresholds.latencyP95}ms`);
  console.log(`Error Rate:     ${avgErrorRate <= thresholds.errorRate ? '✅' : '❌'} ${(avgErrorRate * 100).toFixed(2)}% / ${(thresholds.errorRate * 100).toFixed(2)}%`);

  // Export results
  const fs = require('fs');
  fs.writeFileSync(
    'performance-report/benchmark-results.json',
    JSON.stringify(benchmarks, null, 2)
  );
  console.log('
📄 Results saved to performance-report/benchmark-results.json');
}

main().catch(console.error);
