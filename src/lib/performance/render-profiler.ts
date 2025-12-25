export class RenderProfiler {
  static profile(componentName: string) {
    const start = performance.now()
    return () => {
      const end = performance.now()
      console.log(`${componentName}: ${end - start}ms`)
    }
  }
}
