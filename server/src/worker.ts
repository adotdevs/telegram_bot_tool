import { Worker } from "bullmq";
import { connectMongo } from "./db/mongo.js";
import { connection } from "./queues/connection.js";
import { Q_ADD_USER, Q_CAMPAIGN_TICK, Q_SCRAPE, Q_SEND_MESSAGE, Q_AUTO_POST } from "./queues/names.js";
import {
  handleAddUser,
  handleCampaignTick,
  handleScrape,
  handleSendMessage,
} from "./workers/handlers.js";
import { handleAutoPost, resumeActiveAutoPostSchedules } from "./workers/autoPostWorker.js";

async function main(): Promise<void> {
  await connectMongo();

  const concurrency = 1;

  const workers = [
    new Worker(Q_SCRAPE, async (job) => handleScrape(job), { connection, concurrency }),
    new Worker(Q_ADD_USER, async (job) => handleAddUser(job), { connection, concurrency }),
    new Worker(Q_SEND_MESSAGE, async (job) => handleSendMessage(job), { connection, concurrency }),
    new Worker(Q_CAMPAIGN_TICK, async (job) => handleCampaignTick(job), { connection, concurrency: 1 }),
    new Worker(Q_AUTO_POST, async (job) => handleAutoPost(job), { connection, concurrency: 1 }),
  ];

  for (const w of workers) {
    w.on("error", (err) => {
      console.error(`[worker:${w.name}]`, err.message || err);
    });
  }

  await resumeActiveAutoPostSchedules();

  console.log("Workers listening on Redis queues (including auto-post)");
}


main().catch((e) => {
  console.error(e);
  process.exit(1);
});
