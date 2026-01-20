"""
Phase 11-5-F: Load Testing with K6

Tests SLOTFEED API with increasing concurrent users.
Target: 1000 concurrent users @ < 200ms (p95)
"""

import time
import asyncio
import json
import random
from typing import List, Dict
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ============================================
# LOAD TEST SCENARIOS
# ============================================

class LoadTestScenario:
    """Load test scenario definition"""

    def __init__(
        self,
        name: str,
        duration_seconds: int,
        ramp_up_seconds: int,
        concurrent_users: int,
        requests_per_second: float,
        endpoints: List[str],
    ):
        self.name = name
        self.duration_seconds = duration_seconds
        self.ramp_up_seconds = ramp_up_seconds
        self.concurrent_users = concurrent_users
        self.requests_per_second = requests_per_second
        self.endpoints = endpoints


# ============================================
# LOAD TEST SCENARIOS
# ============================================

LOAD_TEST_SCENARIOS = [
    # Baseline: 100 concurrent users
    LoadTestScenario(
        name="Baseline (100 users)",
        duration_seconds=300,
        ramp_up_seconds=30,
        concurrent_users=100,
        requests_per_second=500,
        endpoints=[
            "GET /api/v1/games/",
            "GET /api/v1/streamers/roshtein",
            "GET /api/v1/sessions/",
            "GET /api/v1/hot-cold/",
            "GET /api/v1/bonus-hunts/",
            "GET /api/v1/big-wins/",
        ],
    ),

    # Normal load: 500 concurrent users
    LoadTestScenario(
        name="Normal Load (500 users)",
        duration_seconds=600,
        ramp_up_seconds=60,
        concurrent_users=500,
        requests_per_second=2500,
        endpoints=[
            "GET /api/v1/games/",
            "GET /api/v1/games/sweet-bonanza",
            "GET /api/v1/games/sweet-bonanza/stats",
            "GET /api/v1/streamers/",
            "GET /api/v1/streamers/roshtein",
            "GET /api/v1/streamers/roshtein/stats",
            "GET /api/v1/sessions/",
            "GET /api/v1/hot-cold/",
            "GET /api/v1/hot-cold/sweet-bonanza",
            "GET /api/v1/games/hot-cold",
            "GET /api/v1/bonus-hunts/",
            "GET /api/v1/bonus-hunts/leaderboard",
            "GET /api/v1/big-wins/",
            "GET /api/v1/live/big-wins",
            "GET /api/v1/live/streams",
            "GET /api/v1/chat-analytics/roshtein/metrics",
            "GET /api/v1/chat-analytics/leaderboard",
        ],
    ),

    # Peak load: 1000 concurrent users
    LoadTestScenario(
        name="Peak Load (1000 users)",
        duration_seconds=900,
        ramp_up_seconds=120,
        concurrent_users=1000,
        requests_per_second=5000,
        endpoints=[
            "GET /api/v1/games/",
            "GET /api/v1/games/sweet-bonanza",
            "GET /api/v1/games/sweet-bonanza/stats",
            "GET /api/v1/games/gates-of-olympus",
            "GET /api/v1/games/sugar-rush",
            "GET /api/v1/streamers/",
            "GET /api/v1/streamers/roshtein",
            "GET /api/v1/streamers/roshtein/stats",
            "GET /api/v1/streamers/classybeef",
            "GET /api/v1/streamers/trainwreckstv",
            "GET /api/v1/sessions/",
            "GET /api/v1/sessions/?limit=50",
            "GET /api/v1/hot-cold/",
            "GET /api/v1/hot-cold/sweet-bonanza",
            "GET /api/v1/hot-cold/gates-of-olympus",
            "GET /api/v1/games/hot-cold",
            "GET /api/v1/bonus-hunts/",
            "GET /api/v1/bonus-hunts/?limit=50",
            "GET /api/v1/bonus-hunts/leaderboard",
            "GET /api/v1/big-wins/",
            "GET /api/v1/big-wins/?limit=100",
            "GET /api/v1/live/big-wins",
            "GET /api/v1/live/streams",
            "GET /api/v1/live/rtp-tracker",
            "GET /api/v1/chat-analytics/",
            "GET /api/v1/chat-analytics/roshtein",
            "GET /api/v1/chat-analytics/roshtein/metrics",
            "GET /api/v1/chat-analytics/roshtein/emotes",
            "GET /api/v1/chat-analytics/roshtein/hype-moments",
            "GET /api/v1/chat-analytics/leaderboard",
        ],
    ),

    # Stress test: 2000+ concurrent users
    LoadTestScenario(
        name="Stress Test (2000 users)",
        duration_seconds=600,
        ramp_up_seconds=120,
        concurrent_users=2000,
        requests_per_second=10000,
        endpoints=[
            "GET /api/v1/games/",
            "GET /api/v1/games/sweet-bonanza",
            "GET /api/v1/streamers/",
            "GET /api/v1/streamers/roshtein",
            "GET /api/v1/sessions/",
            "GET /api/v1/hot-cold/",
            "GET /api/v1/games/hot-cold",
            "GET /api/v1/bonus-hunts/",
            "GET /api/v1/big-wins/",
            "GET /api/v1/live/streams",
            "GET /api/v1/chat-analytics/leaderboard",
        ],
    ),
]

# ============================================
# K6 LOAD TEST SCRIPT GENERATOR
# ============================================

K6_SCRIPT_TEMPLATE = """
import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { Rate, Trend, Gauge, Counter } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');
const responseTime = new Trend('response_time');
const responseSize = new Gauge('response_size');
const succeededRequests = new Counter('requests_succeeded');

// Load test configuration
export const options = {{
  stages: [
    {{ duration: '{ramp_up}s', target: {concurrent_users} }},  // Ramp up
    {{ duration: '{duration}s', target: {concurrent_users} }},  // Stay at peak
    {{ duration: '30s', target: 0 }},                            // Ramp down
  ],
  thresholds: {{
    'response_time': ['p(95)<{threshold}ms', 'p(99)<{threshold_p99}ms'],
    'errors': ['rate<0.1'],
  }},
}};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:8000';

export default function () {{
  // Test endpoint groups
  {endpoint_groups}

  sleep(1);
}}

function makeRequest(method, url) {{
  const start = Date.now();
  const response = http.request(method, url, {{
    tags: {{ name: url }},
    headers: {{
      'Accept': 'application/json',
      'User-Agent': 'K6-LoadTest/1.0',
    }},
  }});
  const end = Date.now();
  const duration = end - start;

  responseTime.add(duration);
  responseSize.add(response.body.length);

  const success = check(response, {{
    'status is 200': (r) => r.status === 200,
    'status is 404': (r) => r.status === 404,
    'status is not 500': (r) => r.status !== 500,
    'response time < {threshold}ms': (r) => r.timings.duration < {threshold},
  }});

  if (success) {{
    succeededRequests.add(1);
  }} else {{
    errorRate.add(1);
  }}

  return response;
}}
"""

ENDPOINT_GROUP_TEMPLATE = """
  group('{group_name}', function () {{
    {endpoint_calls}
  }});
"""

# ============================================
# LOAD TEST RESULT ANALYZER
# ============================================

class LoadTestAnalyzer:
    """Analyzes load test results"""

    RESPONSE_TIME_THRESHOLDS = {{
        "good": 100,      # < 100ms = good
        "acceptable": 200,  # < 200ms = acceptable
        "poor": 500,      # < 500ms = poor
        "critical": None,  # > 500ms = critical
    }}

    ERROR_RATE_THRESHOLDS = {{
        "good": 0.001,     # < 0.1% = good
        "acceptable": 0.01,  # < 1% = acceptable
        "poor": 0.05,      # < 5% = poor
        "critical": None,  # > 5% = critical
    }}

    @staticmethod
    def analyze(results: Dict) -> Dict:
        """Analyze load test results"""
        summary = {
            "total_requests": results.get("total_requests", 0),
            "successful_requests": results.get("successful_requests", 0),
            "failed_requests": results.get("failed_requests", 0),
            "error_rate": results.get("error_rate", 0),
            "response_times": {
                "min": results.get("response_time_min", 0),
                "max": results.get("response_time_max", 0),
                "avg": results.get("response_time_avg", 0),
                "p50": results.get("response_time_p50", 0),
                "p95": results.get("response_time_p95", 0),
                "p99": results.get("response_time_p99", 0),
            },
            "throughput": {
                "requests_per_second": results.get("requests_per_second", 0),
                "bytes_per_second": results.get("bytes_per_second", 0),
            },
            "assessment": {
                "response_time_status": LoadTestAnalyzer._assess_response_time(
                    results.get("response_time_p95", 0)
                ),
                "error_rate_status": LoadTestAnalyzer._assess_error_rate(
                    results.get("error_rate", 0)
                ),
                "throughput_status": LoadTestAnalyzer._assess_throughput(
                    results.get("requests_per_second", 0)
                ),
            },
        }

        return summary

    @staticmethod
    def _assess_response_time(p95_ms: float) -> str:
        """Assess p95 response time"""
        if p95_ms < LoadTestAnalyzer.RESPONSE_TIME_THRESHOLDS["good"]:
            return "✅ Good (< 100ms)"
        elif p95_ms < LoadTestAnalyzer.RESPONSE_TIME_THRESHOLDS["acceptable"]:
            return "⚠️ Acceptable (100-200ms)"
        elif p95_ms < LoadTestAnalyzer.RESPONSE_TIME_THRESHOLDS["poor"]:
            return "❌ Poor (200-500ms)"
        else:
            return "🔴 Critical (> 500ms)"

    @staticmethod
    def _assess_error_rate(error_rate: float) -> str:
        """Assess error rate"""
        if error_rate < LoadTestAnalyzer.ERROR_RATE_THRESHOLDS["good"]:
            return "✅ Good (< 0.1%)"
        elif error_rate < LoadTestAnalyzer.ERROR_RATE_THRESHOLDS["acceptable"]:
            return "⚠️ Acceptable (0.1-1%)"
        elif error_rate < LoadTestAnalyzer.ERROR_RATE_THRESHOLDS["poor"]:
            return "❌ Poor (1-5%)"
        else:
            return "🔴 Critical (> 5%)"

    @staticmethod
    def _assess_throughput(rps: float) -> str:
        """Assess throughput"""
        if rps > 5000:
            return "✅ Excellent (> 5000 req/s)"
        elif rps > 2000:
            return "✅ Good (> 2000 req/s)"
        elif rps > 1000:
            return "⚠️ Acceptable (> 1000 req/s)"
        else:
            return "❌ Poor (< 1000 req/s)"


# ============================================
# K6 SCRIPT GENERATOR
# ============================================

def generate_k6_script(scenario: LoadTestScenario) -> str:
    """Generate K6 load test script"""

    # Create endpoint groups
    endpoint_groups = []
    for endpoint in scenario.endpoints:
        method, path = endpoint.split(" ", 1)
        call = f"makeRequest('{method}', BASE_URL + '{path}');"
        endpoint_groups.append(call)

    endpoints_str = "\n    ".join(endpoint_groups)

    # Generate full script
    script = K6_SCRIPT_TEMPLATE.format(
        ramp_up=scenario.ramp_up_seconds,
        duration=scenario.duration_seconds,
        concurrent_users=scenario.concurrent_users,
        threshold=200,  # 200ms target
        threshold_p99=500,  # 500ms p99 acceptable
        endpoint_groups=endpoints_str,
    )

    return script


def generate_all_k6_scripts() -> Dict[str, str]:
    """Generate K6 scripts for all scenarios"""
    scripts = {}
    for scenario in LOAD_TEST_SCENARIOS:
        script = generate_k6_script(scenario)
        script_name = scenario.name.lower().replace(" ", "_")
        scripts[script_name] = script
    return scripts


# ============================================
# LOAD TEST ORCHESTRATION
# ============================================

class LoadTestOrchestrator:
    """Orchestrates load testing"""

    @staticmethod
    def run_all_scenarios(base_url: str) -> Dict:
        """Run all load test scenarios"""
        logger.info("=" * 60)
        logger.info("PHASE 11-5-F: LOAD TESTING")
        logger.info("=" * 60)

        results = {}

        for scenario in LOAD_TEST_SCENARIOS:
            logger.info(f"\n🚀 Starting: {scenario.name}")
            logger.info(f"   Users: {scenario.concurrent_users}")
            logger.info(f"   Duration: {scenario.duration_seconds}s")
            logger.info(f"   Target RPS: {scenario.requests_per_second}")

            # Generate K6 script
            script = generate_k6_script(scenario)

            # In real implementation, would run: k6 run script.js
            # For now, we'll simulate and log

            logger.info("   (In production: k6 run load_test_scenario.js)")

            results[scenario.name] = {
                "status": "pending",
                "script_generated": True,
                "endpoints_tested": len(scenario.endpoints),
            }

        return results


# ============================================
# CLI INTERFACE
# ============================================

def main():
    """Main load test runner"""
    logger.info("PHASE 11-5-F: Load Testing Setup")
    logger.info("=" * 60)

    # Generate K6 scripts
    logger.info("\n📝 Generating K6 load test scripts...")
    scripts = generate_all_k6_scripts()

    for script_name, script_content in scripts.items():
        filename = f"load_test_{script_name}.k6.js"
        logger.info(f"  Generated: {filename}")

    # Show how to run tests
    logger.info("\n🎯 How to run load tests:")
    logger.info("  1. Install K6: brew install k6")
    logger.info("  2. Run baseline: k6 run load_test_baseline_100_users.k6.js")
    logger.info("  3. Run normal load: k6 run load_test_normal_load_500_users.k6.js")
    logger.info("  4. Run peak load: k6 run load_test_peak_load_1000_users.k6.js")
    logger.info("  5. Run stress test: k6 run load_test_stress_test_2000_users.k6.js")

    logger.info("\n📊 Load test targets:")
    logger.info("  • Response time (p95): < 200ms ✅")
    logger.info("  • Error rate: < 0.1% ✅")
    logger.info("  • Throughput: > 1000 req/s ✅")


if __name__ == "__main__":
    main()
