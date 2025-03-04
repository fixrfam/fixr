import { Resend } from "resend";
import { env } from "../env";

const resend_key = env.RESEND_KEY;

export const resend = new Resend(resend_key);
