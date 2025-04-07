import { z } from "zod";

export const employeeRoles = z.union([
    z.literal("admin"),
    z.literal("manager"),
    z.literal("employee"),
]);
