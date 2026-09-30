import { MongoWorker } from "./queues/mongoQueue.js";
import { connectMongo } from "./db/mongo.js";
import { Q_ADD_USER, Q_CAMPAIGN_TICK, Q_SCRAPE, Q_SEND_MESSAGE, Q_AUTO_POST } from "./queues/names.js";
import { handleAddUser, handleCampaignTick, handleScrape, handleSendMessage, } from "./workers/handlers.js";
import { handleAutoPost, resumeActiveAutoPostSchedules } from "./workers/autoPostWorker.js";
export async function startWorkers() {
    await connectMongo();
    const concurrency = 1;
    const workers = [
        new MongoWorker(Q_SCRAPE, async (job) => handleScrape(job), { concurrency }),
        new MongoWorker(Q_ADD_USER, async (job) => handleAddUser(job), { concurrency }),
        new MongoWorker(Q_SEND_MESSAGE, async (job) => handleSendMessage(job), { concurrency }),
        new MongoWorker(Q_CAMPAIGN_TICK, async (job) => handleCampaignTick(job), { concurrency: 1 }),
        new MongoWorker(Q_AUTO_POST, async (job) => handleAutoPost(job), { concurrency: 1 }),
    ];
    for (const w of workers) {
        w.on("error", (err) => {
            console.error(`[worker:${w.name}]`, err.message || err);
        });
    }
    await resumeActiveAutoPostSchedules();
    console.log("Workers listening on MongoDB queues (including auto-post)");
}
// Run standalone if launched via node worker.js or tsx worker.ts
if (process.argv[1] && (process.argv[1].endsWith("worker.js") || process.argv[1].endsWith("worker.ts"))) {
    startWorkers().catch((e) => {
        console.error(e);
        process.exit(1);
    });
}
//# sourceMappingURL=worker.js.map