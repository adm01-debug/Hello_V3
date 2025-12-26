import axios from 'axios';

export interface SyntheticTest {
  name: string;
  url: string;
  interval: number;
  assertions: Assertion[];
}

export interface Assertion {
  type: 'status' | 'responseTime' | 'bodyContains';
  value: any;
}

export class SyntheticMonitoring {
  private tests: SyntheticTest[] = [];

  addTest(test: SyntheticTest) {
    this.tests.push(test);
  }

  async runTests(): Promise<TestResult[]> {
    const results = await Promise.all(
      this.tests.map(test => this.runTest(test))
    );
    return results;
  }

  private async runTest(test: SyntheticTest): Promise<TestResult> {
    const start = Date.now();
    
    try {
      const response = await axios.get(test.url);
      const duration = Date.now() - start;

      const assertionResults = test.assertions.map(assertion => {
        switch (assertion.type) {
          case 'status':
            return {
              passed: response.status === assertion.value,
              message: `Status ${response.status}`,
            };
          case 'responseTime':
            return {
              passed: duration < assertion.value,
              message: `Response time ${duration}ms`,
            };
          case 'bodyContains':
            return {
              passed: response.data.includes(assertion.value),
              message: `Body contains "${assertion.value}"`,
            };
          default:
            return { passed: false, message: 'Unknown assertion' };
        }
      });

      return {
        testName: test.name,
        passed: assertionResults.every(r => r.passed),
        duration,
        assertions: assertionResults,
      };
    } catch (error) {
      return {
        testName: test.name,
        passed: false,
        duration: Date.now() - start,
        error: (error as Error).message,
        assertions: [],
      };
    }
  }
}

interface TestResult {
  testName: string;
  passed: boolean;
  duration: number;
  error?: string;
  assertions: Array<{ passed: boolean; message: string }>;
}
