import Redis from "ioredis";
import { env } from "../env";

export const redis = new Redis({
    host: "localhost",
    port: 6379,
    password: env.REDIS_PASSWORD,
    maxRetriesPerRequest: null,
});
