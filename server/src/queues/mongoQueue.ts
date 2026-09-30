import { EventEmitter } from "node:events";
import { QueueJob, type QueueJobDoc } from "../models/QueueJob.js";

export const jobNotifier = new EventEmitter();
jobNotifier.setMaxListeners(100);

export interface Job<T = any> {
  id: string;
  name: string;
  data: T;
  attemptsMade: number;
}

export interface QueueOptions {
  connection?: any;
  defaultJobOptions?: {
    attempts?: number;
    backoff?: { type: string; delay: number };
    removeOnComplete?: boolean | { count?: number };
    removeOnFail?: boolean | { count?: number };
  };
}

export class MongoQueue<T = any> {
  readonly name: string;
  private defaultAttempts: number;

  constructor(name: string, opts?: QueueOptions) {
    this.name = name;
    this.defaultAttempts = opts?.defaultJobOptions?.attempts ?? 7;
  }

  async add(
    name: string,
    data: T,
    opts?: { delay?: number; attempts?: number }
  ): Promise<Job<T>> {
    const delay = Math.max(0, opts?.delay ?? 0);
    const runAt = new Date(Date.now() + delay);

    const doc = await QueueJob.create({
      queueName: this.name,
      name,
      data,
      status: "pending",
      runAt,
      attempts: 0,
      maxAttempts: opts?.attempts ?? this.defaultAttempts,
    });

    // Notify in-process workers on this queue immediately
    jobNotifier.emit(this.name);

    return {
      id: doc._id.toString(),
      name: doc.name,
      data: doc.data as T,
      attemptsMade: 0,
    };
  }
}

export type JobHandler<T = any> = (job: Job<T>) => Promise<any>;

export interface WorkerOptions {
  concurrency?: number;
  connection?: any;
}

export class MongoWorker<T = any> {
  readonly name: string;
  private handler: JobHandler<T>;
  private concurrency: number;
  private running = false;
  private activeCount = 0;
  private emitter = new EventEmitter();
  private pollTimer: NodeJS.Timeout | null = null;
  private workerId: string;

  constructor(name: string, handler: JobHandler<T>, opts?: WorkerOptions) {
    this.name = name;
    this.handler = handler;
    this.concurrency = Math.max(1, opts?.concurrency ?? 1);
    this.workerId = `${name}-${process.pid}-${Math.random().toString(36).slice(2, 8)}`;

    this.onJobAdded = this.onJobAdded.bind(this);
    jobNotifier.on(this.name, this.onJobAdded);

    this.start();
  }

  on(event: string, listener: (...args: any[]) => void): this {
    this.emitter.on(event, listener);
    return this;
  }

  private emit(event: string, ...args: any[]): boolean {
    return this.emitter.emit(event, ...args);
  }

  private onJobAdded(): void {
    if (this.running && this.activeCount < this.concurrency) {
      this.triggerNext();
    }
  }

  private start(): void {
    this.running = true;
    this.triggerNext();
  }

  private triggerNext(): void {
    if (!this.running || this.activeCount >= this.concurrency) return;
    if (this.pollTimer) {
      clearTimeout(this.pollTimer);
      this.pollTimer = null;
    }
    this.processNext().catch((err) => {
      this.emit("error", err);
    });
  }

  private async processNext(): Promise<void> {
    if (!this.running || this.activeCount >= this.concurrency) return;

    try {
      const now = new Date();

      // Release any stale locks (> 5 minutes old) from crashed or restarted processes
      const staleThreshold = new Date(Date.now() - 5 * 60 * 1000);
      await QueueJob.updateMany(
        {
          queueName: this.name,
          status: "processing",
          lockedAt: { $lt: staleThreshold },
        },
        {
          $set: { status: "pending" },
          $unset: { lockedAt: 1, lockedBy: 1 },
        }
      );

      // Claim the next pending job atomically
      const jobDoc = await QueueJob.findOneAndUpdate(
        {
          queueName: this.name,
          status: "pending",
          runAt: { $lte: now },
        },
        {
          $set: {
            status: "processing",
            lockedAt: now,
            lockedBy: this.workerId,
          },
          $inc: { attempts: 1 },
        },
        {
          sort: { runAt: 1 },
          new: true,
        }
      );

      if (!jobDoc) {
        // No job ready right now. Schedule check for earliest upcoming job or default poll
        const nextUpcoming = await QueueJob.findOne(
          { queueName: this.name, status: "pending" },
          { runAt: 1 },
          { sort: { runAt: 1 } }
        );

        let delayMs = 1500;
        if (nextUpcoming?.runAt) {
          const waitTime = nextUpcoming.runAt.getTime() - Date.now();
          if (waitTime > 0) {
            delayMs = Math.min(Math.max(waitTime, 200), 5000);
          } else {
            delayMs = 50;
          }
        }

        if (this.running && !this.pollTimer) {
          this.pollTimer = setTimeout(() => {
            this.pollTimer = null;
            this.triggerNext();
          }, delayMs);
        }
        return;
      }

      // We claimed a job
      this.activeCount++;

      // If concurrency allows, see if we can immediately pick up another job concurrently
      if (this.activeCount < this.concurrency) {
        setImmediate(() => this.triggerNext());
      }

      const job: Job<T> = {
        id: jobDoc._id.toString(),
        name: jobDoc.name,
        data: jobDoc.data as T,
        attemptsMade: Math.max(0, (jobDoc.attempts ?? 1) - 1),
      };

      try {
        await this.handler(job);
        // Completed successfully: remove from DB to keep storage clean
        await QueueJob.findByIdAndDelete(jobDoc._id);
      } catch (err: any) {
        this.emit("error", err);
        const attempts = jobDoc.attempts ?? 1;
        const maxAttempts = jobDoc.maxAttempts ?? 7;

        if (attempts < maxAttempts) {
          // Exponential backoff: 15s * 2^(attempts-1), max 1 hour
          const backoffMs = Math.min(15000 * Math.pow(2, attempts - 1), 3_600_000);
          await QueueJob.findByIdAndUpdate(jobDoc._id, {
            status: "pending",
            runAt: new Date(Date.now() + backoffMs),
            failedReason: err?.message || String(err),
            $unset: { lockedAt: 1, lockedBy: 1 },
          });
        } else {
          await QueueJob.findByIdAndUpdate(jobDoc._id, {
            status: "failed",
            failedReason: err?.message || String(err),
            $unset: { lockedAt: 1, lockedBy: 1 },
          });
        }
      } finally {
        this.activeCount--;
        // Immediately try to process next job
        if (this.running) {
          setImmediate(() => this.triggerNext());
        }
      }
    } catch (err: any) {
      this.emit("error", err);
      if (this.running && !this.pollTimer) {
        this.pollTimer = setTimeout(() => {
          this.pollTimer = null;
          this.triggerNext();
        }, 3000);
      }
    }
  }

  async close(): Promise<void> {
    this.running = false;
    if (this.pollTimer) {
      clearTimeout(this.pollTimer);
      this.pollTimer = null;
    }
    jobNotifier.off(this.name, this.onJobAdded);
  }
}

// Aliases for compatibility
export { MongoQueue as Queue, MongoWorker as Worker };
