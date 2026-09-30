import { MongoQueue } from "./mongoQueue.js";
import { Q_ADD_USER, Q_CAMPAIGN_TICK, Q_SCRAPE, Q_SEND_MESSAGE, Q_AUTO_POST } from "./names.js";
const defaultJobOpts = {
    attempts: 7,
    backoff: { type: "exponential", delay: 15000 },
    removeOnComplete: { count: 500 },
    removeOnFail: { count: 200 },
};
export const scrapeQueue = new MongoQueue(Q_SCRAPE, { defaultJobOptions: defaultJobOpts });
export const addUserQueue = new MongoQueue(Q_ADD_USER, { defaultJobOptions: defaultJobOpts });
export const sendMessageQueue = new MongoQueue(Q_SEND_MESSAGE, { defaultJobOptions: defaultJobOpts });
export const campaignTickQueue = new MongoQueue(Q_CAMPAIGN_TICK, { defaultJobOptions: defaultJobOpts });
export const autoPostQueue = new MongoQueue(Q_AUTO_POST, { defaultJobOptions: defaultJobOpts });
export async function enqueueScrape(campaignId) {
    await scrapeQueue.add("run", { campaignId }, { delay: 2000 });
}
export async function enqueueCampaignTick(campaignId, delayMs = 5000) {
    await campaignTickQueue.add("tick", { campaignId }, { delay: delayMs });
}
export async function enqueueAutoPost(scheduleId, delayMs = 0) {
    await autoPostQueue.add("post_wave", { scheduleId }, { delay: delayMs });
}
//# sourceMappingURL=setup.js.map