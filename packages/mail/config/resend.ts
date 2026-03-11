import { env } from "@fixr/env/mail";
import { Resend } from "resend";

export const resend = new Resend(env.RESEND_KEY);
