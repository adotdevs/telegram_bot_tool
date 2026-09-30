import type { Job } from "../queues/mongoQueue.js";
export declare function handleScrape(job: Job<{
    campaignId: string;
}>): Promise<void>;
export declare function handleAddUser(job: Job<{
    campaignUserId: string;
}>): Promise<void>;
export declare function handleSendMessage(job: Job<{
    campaignUserId: string;
}>): Promise<void>;
export declare function handleCampaignTick(job: Job<{
    campaignId: string;
}>): Promise<void>;
//# sourceMappingURL=handlers.d.ts.map