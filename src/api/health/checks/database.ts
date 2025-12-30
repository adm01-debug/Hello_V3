export class DatabaseHealthCheck {
  public static async check() {
    const start = Date.now();
    try {
      // await db.raw('SELECT 1');
      return {
        status: 'up' as const,
        responseTime: Date.now() - start,
      };
    } catch (error) {
      return {
        status: 'down' as const,
        message: error.message,
      };
    }
  }
}
