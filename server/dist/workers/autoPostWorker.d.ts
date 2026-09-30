import type { Job } from "../queues/mongoQueue.js";
export declare function handleAutoPost(job: Job<{
    scheduleId: string;
}>): Promise<void>;
/**
 * On worker restart, re-enqueue any active schedules that are pending or due.
 */
export declare function resumeActiveAutoPostSchedules(): Promise<void>;
//# sourceMappingURL=autoPostWorker.d.ts.map