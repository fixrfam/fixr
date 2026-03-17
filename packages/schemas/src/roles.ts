import { z } from "zod";

export const employeeRoles = z.enum([
	"guest",
	"technician",
	"warehouse",
	"financial",
	"manager",
	"admin",
]);
