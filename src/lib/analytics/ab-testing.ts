export class ABTestFramework {
  private tests: Map<string, ABTest> = new Map();

  createTest(name: string, variants: string[]) {
    const variant = this.assignVariant(variants);
    this.tests.set(name, { name, variants, assigned: variant });
    return variant;
  }

  getVariant(name: string): string | undefined {
    return this.tests.get(name)?.assigned;
  }

  private assignVariant(variants: string[]): string {
    const stored = localStorage.getItem('ab-tests');
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed[name]) return parsed[name];
    }
    
    const index = Math.floor(Math.random() * variants.length);
    return variants[index];
  }

  trackConversion(testName: string) {
    Analytics.event('ABTest', 'Conversion', testName);
  }
}

interface ABTest {
  name: string;
  variants: string[];
  assigned: string;
}
