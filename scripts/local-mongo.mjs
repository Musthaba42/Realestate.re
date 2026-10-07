// Optional: run a local MongoDB (single-node replica set) for development when
// you don't want to use MongoDB Atlas. Data is kept in ./.mongo-data.
//
//   npm run db:local
//   DATABASE_URL="mongodb://127.0.0.1:27017/goldengroups?replicaSet=rs0&directConnection=true"
//
// Prisma requires a replica set; MongoDB Atlas clusters already are one.
import { MongoMemoryReplSet } from "mongodb-memory-server";
import { mkdirSync } from "node:fs";
import path from "node:path";

const dbPath = path.resolve(".mongo-data");
mkdirSync(dbPath, { recursive: true });

const replSet = await MongoMemoryReplSet.create({
  replSet: { name: "rs0", count: 1, storageEngine: "wiredTiger" },
  instanceOpts: [{ port: Number(process.env.MONGO_PORT || 27017), dbPath }],
});

console.log("Local MongoDB is running.");
console.log(`DATABASE_URL="mongodb://127.0.0.1:${process.env.MONGO_PORT || 27017}/goldengroups?replicaSet=rs0&directConnection=true"`);
console.log("Press Ctrl+C to stop.");

const stop = async () => {
  await replSet.stop({ doCleanup: false });
  process.exit(0);
};
process.on("SIGINT", stop);
process.on("SIGTERM", stop);
