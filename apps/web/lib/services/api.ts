import { axios } from "../auth/axios";
import { tryCatch } from "../utils";

export async function getApiHealthStatus() {
    const { data: res, error } = await tryCatch(axios.get<"OK">("/"));

    if (error) return false;

    const healthy = res.status == 200 && res.data == "OK";

    return healthy;
}
