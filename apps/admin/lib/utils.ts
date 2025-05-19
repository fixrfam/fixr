import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { type ApiResponse } from "@fixr/schemas/utils";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function api(path: string) {
    return `${process.env.NEXT_PUBLIC_API_URL}${path}`;
}

export function parseJwt(token?: string) {
    if (token) {
        try {
            return JSON.parse(atob(token.split(".")[1]!));
        } catch (_) {
            return null;
        }
    }
    return null;
}

export const isClientSide = (): boolean => typeof window !== "undefined";

export const generateRandomPassword = (length = 12): string => {
    if (length < 8 || length > 128) {
        throw new Error("Password length must be between 8 and 128 characters.");
    }

    const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const lowercase = "abcdefghijklmnopqrstuvwxyz";
    const numbers = "0123456789";
    const special = "#?!@$%^&*-";
    const all = uppercase + lowercase + numbers + special;

    const getRandomChar = (charset: string) =>
        charset[Math.floor(Math.random() * charset.length)] || "";

    let password =
        getRandomChar(uppercase) +
        getRandomChar(lowercase) +
        getRandomChar(numbers) +
        getRandomChar(special);

    for (let i = password.length; i < length; i++) {
        password += getRandomChar(all);
    }

    /* Shuffle the password to avoid predictable patterns */
    return password
        .split("")
        .sort(() => Math.random() - 0.5)
        .join("");
};

// Types for the result object with discriminated union
type Success<T> = {
    data: T;
    error: null;
};

type Failure<E> = {
    data: null;
    error: E;
};

type Result<T, E = Error> = Success<T> | Failure<E>;

// Main wrapper function
export async function tryCatch<T, E = Error>(promise: Promise<T>): Promise<Result<T, E>> {
    try {
        const data = await promise;
        return { data, error: null };
    } catch (error) {
        return { data: null, error: error as E };
    }
}

export const apiResponse = ({ status, error, message, code, data }: ApiResponse) => {
    return { status, error, message, code, data };
};
