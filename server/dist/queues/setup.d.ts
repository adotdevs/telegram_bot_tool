import { Queue } from "bullmq";
export declare const scrapeQueue: Queue<any, any, string, any, any, string>;
export declare const addUserQueue: Queue<any, any, string, any, any, string>;
export declare const sendMessageQueue: Queue<any, any, string, any, any, string>;
export declare const campaignTickQueue: Queue<any, any, string, any, any, string>;
export declare const autoPostQueue: Queue<any, any, string, any, any, string>;
export declare function enqueueScrape(campaignId: string): Promise<void>;
export declare function enqueueCampaignTick(campaignId: string, delayMs?: number): Promise<void>;
export declare function enqueueAutoPost(scheduleId: string, delayMs?: number): Promise<void>;
//# sourceMappingURL=setup.d.ts.map