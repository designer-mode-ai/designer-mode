/**
 * Shared relay state — used by both the HTTP server and the MCP server.
 * Implements a simple in-memory queue with promise-based waiting.
 */

export class RelayState {
  constructor() {
    /** @type {string[]} */
    this.messageQueue = [];
    /** @type {Array<(msg: string) => void>} */
    this.waitingResolvers = [];
    /** @type {string[]} */
    this.responseQueue = [];
    /** @type {Array<(msg: string) => void>} */
    this.responseWaiters = [];
  }

  /** Called by HTTP handler when browser POSTs /api/message */
  receiveMessage(body) {
    if (this.waitingResolvers.length > 0) {
      const resolve = this.waitingResolvers.shift();
      resolve(body);
    } else {
      this.messageQueue.push(body);
    }
  }

  /** Called by MCP tool or designer-wait CLI — resolves when a message arrives */
  waitForMessage(timeoutMs = 300000) {
    if (this.messageQueue.length > 0) {
      return Promise.resolve(this.messageQueue.shift());
    }
    return new Promise((resolve, reject) => {
      const wrappedResolve = (msg) => {
        clearTimeout(timer);
        resolve(msg);
      };
      const timer = setTimeout(() => {
        const idx = this.waitingResolvers.indexOf(wrappedResolve);
        if (idx !== -1) this.waitingResolvers.splice(idx, 1);
        reject(new Error('TIMEOUT'));
      }, timeoutMs);
      this.waitingResolvers.push(wrappedResolve);
    });
  }

  /** Called by agent to send response back to panel */
  sendResponse(message) {
    if (this.responseWaiters.length > 0) {
      const resolve = this.responseWaiters.shift();
      resolve(message);
    } else {
      this.responseQueue.push(message);
    }
  }

  /** Drain any queued responses — called before a new request to avoid stale data */
  flushResponses() {
    this.responseQueue.length = 0;
  }

  /** Called by HTTP handler for GET /api/poll */
  waitForResponse(timeoutMs = 30000) {
    if (this.responseQueue.length > 0) {
      return Promise.resolve(this.responseQueue.shift());
    }
    return new Promise((resolve, reject) => {
      const wrappedResolve = (msg) => {
        clearTimeout(timer);
        resolve(msg);
      };
      const timer = setTimeout(() => {
        const idx = this.responseWaiters.indexOf(wrappedResolve);
        if (idx !== -1) this.responseWaiters.splice(idx, 1);
        reject(new Error('TIMEOUT'));
      }, timeoutMs);
      this.responseWaiters.push(wrappedResolve);
    });
  }
}
