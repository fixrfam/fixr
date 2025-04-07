import { z } from "zod";
import { jwtPayload } from "@repo/schemas/auth";
import server from "../server";

export function signJWT({
    payload,
    expiresIn,
}: {
    payload: z.infer<typeof jwtPayload>;
    expiresIn?: string | number;
}): string {
    return server.jwt.sign(payload, { expiresIn: expiresIn ?? "300s" });
}

export function verifyJWT(token: string) {
    try {
        const decoded = server.jwt.verify(token);
        return { payload: decoded, expired: false };
    } catch (error) {
        return { payload: null, expired: true };
    }
}
