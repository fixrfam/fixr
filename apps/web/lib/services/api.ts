import { axios } from "../auth/axios";

export async function getApiHealthStatus() {
    const res = await axios.get<"OK">("/");
    const healthy = res.status == 200 && res.data == "OK";
    return healthy;
}
