import { MongoQueue } from "./mongoQueue.js";
export declare const scrapeQueue: MongoQueue<any>;
export declare const addUserQueue: MongoQueue<any>;
export declare const sendMessageQueue: MongoQueue<any>;
export declare const campaignTickQueue: MongoQueue<any>;
export declare const autoPostQueue: MongoQueue<any>;
export declare function enqueueScrape(campaignId: string): Promise<void>;
export declare function enqueueCampaignTick(campaignId: string, delayMs?: number): Promise<void>;
export declare function enqueueAutoPost(scheduleId: string, delayMs?: number): Promise<void>;
//# sourceMappingURL=setup.d.ts.map