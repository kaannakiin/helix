/**
 * Storefront Router — Upstream Health Checker
 *
 * Periodically checks if B2C and B2B upstream apps are healthy.
 * Router gracefully returns 503 for unhealthy upstreams instead of hanging.
 */

export interface UpstreamStatus {
  b2c: boolean;
  b2b: boolean;
}

const CHECK_INTERVAL_MS = 30_000;
const CHECK_TIMEOUT_MS = 3_000;

export class UpstreamHealth {
  private status: UpstreamStatus = { b2c: false, b2b: false };
  private b2cUrl: string;
  private b2bUrl: string;
  private timer: ReturnType<typeof setInterval> | null = null;

  constructor(b2cUrl: string, b2bUrl: string) {
    this.b2cUrl = b2cUrl;
    this.b2bUrl = b2bUrl;
  }

  async start(): Promise<void> {
    await this.check();

    this.timer = setInterval(() => {
      this.check().catch(() => {
        /* swallow — individual upstream failures are tracked */
      });
    }, CHECK_INTERVAL_MS);
  }

  stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  getStatus(): UpstreamStatus {
    return { ...this.status };
  }

  isHealthy(businessModel: 'B2C' | 'B2B'): boolean {
    return businessModel === 'B2C' ? this.status.b2c : this.status.b2b;
  }

  private async check(): Promise<void> {
    const [b2c, b2b] = await Promise.allSettled([
      this.checkUpstream(this.b2cUrl),
      this.checkUpstream(this.b2bUrl),
    ]);

    this.status.b2c = b2c.status === 'fulfilled' && b2c.value;
    this.status.b2b = b2b.status === 'fulfilled' && b2b.value;
  }

  private async checkUpstream(url: string): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), CHECK_TIMEOUT_MS);

      const res = await fetch(url, {
        method: 'HEAD',
        signal: controller.signal,
      });

      clearTimeout(timeout);

      return res.status < 500;
    } catch {
      return false;
    }
  }
}
