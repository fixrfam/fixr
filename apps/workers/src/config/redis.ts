import { env } from "@fixr/env/server";
import Redis from "ioredis";

export const redis = new Redis(env.REDIS_URL, { maxRetriesPerRequest: null });
