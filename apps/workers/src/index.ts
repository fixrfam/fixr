import { registerGracefulShutdown } from "./shutdown";
import { startEmailWorker } from "./workers/email-worker";

registerGracefulShutdown([startEmailWorker()]);
