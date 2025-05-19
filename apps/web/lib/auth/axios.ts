import axios, { AxiosError, AxiosRequestConfig, InternalAxiosRequestConfig } from "axios";
import { parseCookies } from "nookies";
import { isClientSide, parseJwt } from "../utils";
import { cookieKey } from "@fixr/constants/cookies";

const axiosClient = axios.create({
    withCredentials: true,
    baseURL: process.env.NEXT_PUBLIC_API_URL,
});

let isRefreshing = false;
let failedQueue: Array<{
    resolve: (value?: unknown) => void;
    reject: (reason?: unknown) => void;
    config: AxiosRequestConfig;
}> = [];

const processQueue = (error: AxiosError | null) => {
    failedQueue.forEach((prom) => {
        if (!error) {
            prom.resolve(axiosClient.request(prom.config));
        } else {
            prom.reject(error);
        }
    });
    failedQueue = [];
};

/**
 * This appends the JWT+refreshToken cookies at every request SERVER SIDE
 * We import next/headers inside the conditional so it doesnt crash on the client
 */
axiosClient.interceptors.request.use(async (config) => {
    if (!isClientSide()) {
        const { cookies } = await import("next/headers");
        const cookiesString = (await cookies())
            .getAll()
            .map((item) => `${item.name}=${item.value}`)
            .join("; ");
        config.headers.set("Cookie", cookiesString);
    }

    return config;
});

/**
 * This verifies jwt presence and expiration on request, client side, using nookies.
 */
axiosClient.interceptors.request.use(
    async (config) => {
        const cookies = parseCookies();
        const jwt = cookies[cookieKey("session")];
        const payload = parseJwt(jwt as string);

        if (!jwt || (payload && payload.exp * 1000 < Date.now())) {
            try {
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/token`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    credentials: "include",
                    body: JSON.stringify({}),
                });
                const setCookie = res.headers.get("Set-Cookie");
                config.headers.set("Set-Cookie", setCookie);
            } catch (error) {
                return Promise.reject(error);
            }
        }

        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

axios.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
        const originalRequest = error.config;

        if (
            error.response?.status === 401 &&
            !originalRequest?.url?.includes("/auth") &&
            !originalRequest?.url?.includes("/api")
        ) {
            if (!isRefreshing) {
                isRefreshing = true;

                try {
                    const refresh = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/token`, {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        credentials: "include",
                        body: JSON.stringify({}),
                    });
                    isRefreshing = false;
                    const setCookie = refresh.headers.get("Set-Cookie");
                    processQueue(null);
                    originalRequest?.headers.set("Set-Cookie", setCookie);
                    return axiosClient.request(originalRequest as InternalAxiosRequestConfig);
                } catch (refreshError) {
                    isRefreshing = false;
                    processQueue(refreshError as AxiosError);
                    return Promise.reject(refreshError);
                }
            }

            return new Promise((resolve, reject) => {
                if (originalRequest) {
                    failedQueue.push({ resolve, reject, config: originalRequest });
                } else {
                    reject(error);
                }
            });
        }

        if (error.response?.status === 401) {
            window.location.reload();
        }

        return Promise.reject(error);
    }
);

export { axiosClient as axios };
