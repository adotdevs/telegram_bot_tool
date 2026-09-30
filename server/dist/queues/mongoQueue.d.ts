import { EventEmitter } from "node:events";
export declare const jobNotifier: EventEmitter<[never]>;
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
        backoff?: {
            type: string;
            delay: number;
        };
        removeOnComplete?: boolean | {
            count?: number;
        };
        removeOnFail?: boolean | {
            count?: number;
        };
    };
}
export declare class MongoQueue<T = any> {
    readonly name: string;
    private defaultAttempts;
    constructor(name: string, opts?: QueueOptions);
    add(name: string, data: T, opts?: {
        delay?: number;
        attempts?: number;
    }): Promise<Job<T>>;
}
export type JobHandler<T = any> = (job: Job<T>) => Promise<any>;
export interface WorkerOptions {
    concurrency?: number;
    connection?: any;
}
export declare class MongoWorker<T = any> {
    readonly name: string;
    private handler;
    private concurrency;
    private running;
    private activeCount;
    private emitter;
    private pollTimer;
    private workerId;
    constructor(name: string, handler: JobHandler<T>, opts?: WorkerOptions);
    on(event: string, listener: (...args: any[]) => void): this;
    private emit;
    private onJobAdded;
    private start;
    private triggerNext;
    private processNext;
    close(): Promise<void>;
}
export { MongoQueue as Queue, MongoWorker as Worker };
//# sourceMappingURL=mongoQueue.d.ts.map