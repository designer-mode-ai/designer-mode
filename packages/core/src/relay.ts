export type RelayStatus = 'connected' | 'disconnected' | 'checking';

export class RelayClient {
  private baseUrl: string;
  private pollInterval: ReturnType<typeof setInterval> | null = null;
  private onResponseCallback: ((r: string) => void) | null = null;

  constructor(baseUrl = 'http://localhost:3334') {
    this.baseUrl = baseUrl;
  }

  async sendMessage(prompt: string): Promise<void> {
    await fetch(`${this.baseUrl}/api/message`, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: prompt,
    });
    this.startPolling();
  }

  onResponse(cb: (response: string) => void) {
    this.onResponseCallback = cb;
  }

  private startPolling() {
    if (this.pollInterval) return;
    this.pollInterval = setInterval(async () => {
      try {
        const r = await fetch(`${this.baseUrl}/api/poll`);
        if (r.status === 200) {
          const text = await r.text();
          if (text && this.onResponseCallback) {
            this.onResponseCallback(text);
            this.stopPolling();
          }
        }
      } catch {}
    }, 2000);
  }

  stopPolling() {
    if (this.pollInterval) { clearInterval(this.pollInterval); this.pollInterval = null; }
  }

  async checkHealth(): Promise<RelayStatus> {
    try {
      const r = await fetch(`${this.baseUrl}/api/health`, { signal: AbortSignal.timeout(2000) });
      return r.ok ? 'connected' : 'disconnected';
    } catch { return 'disconnected'; }
  }
}
