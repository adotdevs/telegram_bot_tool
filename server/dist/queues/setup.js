import { Queue } from "bullmq";
import { connection } from "./connection.js";
import { Q_ADD_USER, Q_CAMPAIGN_TICK, Q_SCRAPE, Q_SEND_MESSAGE } from "./names.js";
const defaultJobOpts = {
    attempts: 7,
    backoff: { type: "exponential", delay: 15000 },
    removeOnComplete: { count: 500 },
    removeOnFail: { count: 200 },
};
export const scrapeQueue = new Queue(Q_SCRAPE, { connection, defaultJobOptions: defaultJobOpts });
export const addUserQueue = new Queue(Q_ADD_USER, { connection, defaultJobOptions: defaultJobOpts });
export const sendMessageQueue = new Queue(Q_SEND_MESSAGE, { connection, defaultJobOptions: defaultJobOpts });
export const campaignTickQueue = new Queue(Q_CAMPAIGN_TICK, { connection, defaultJobOptions: defaultJobOpts });
export async function enqueueScrape(campaignId) {
    await scrapeQueue.add("run", { campaignId }, { delay: 2000 });
}
export async function enqueueCampaignTick(campaignId, delayMs = 5000) {
    await campaignTickQueue.add("tick", { campaignId }, { delay: delayMs });
}
//# sourceMappingURL=setup.js.map