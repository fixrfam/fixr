import { z } from "zod";

const REPEATED_DIGITS_REGEX = /^(\d)\1+$/;
const ONLY_DIGITS_REGEX = /\D/g;

function shouldValidateDocuments() {
	const appEnv =
		process.env.NEXT_PUBLIC_APP_ENV ??
		process.env.APP_ENV ??
		process.env.NODE_ENV;

	return appEnv === "production";
}

function onlyDigits(value: string) {
	return value.replace(ONLY_DIGITS_REGEX, "");
}

function isRepeatedDigits(value: string) {
	return REPEATED_DIGITS_REGEX.test(value);
}

/**
 * Validates a Brazilian CPF (Cadastro de Pessoas Físicas) document number.
 *
 * The algorithm veriies the two check digits:
 * 1st check digit: multiply digits 1-9 by weights 10 -> 2, sum them, multiply by 10, take %11
 * 2nd check digit: multiply digits 1-10 by weights 11 -> 2, sum them, multiply by 10, take %11
 * If the remainder is 10, the check digit is 0.
 */
export function isValidCPF(cpf: string) {
	const value = onlyDigits(cpf);

	if (value.length !== 11 || isRepeatedDigits(value)) {
		return false;
	}

	const calcDigit = (base: string, factor: number) => {
		let total = 0;
		let currentFactor = factor;

		for (const char of base) {
			total += Number(char) * currentFactor--;
		}

		const rest = (total * 10) % 11;
		return rest === 10 ? 0 : rest;
	};

	const digit1 = calcDigit(value.slice(0, 9), 10);
	const digit2 = calcDigit(value.slice(0, 10), 11);

	return digit1 === Number(value[9]) && digit2 === Number(value[10]);
}

/**
 * Validates a Brazilian CNPJ (Cadastro Nacional da Pessoa Jurídica) document number.
 *
 * The algorithm verifies the two check digits using fixed weight arrays:
 * 1st check digit: multiply digits 1-12 by weights [5,4,3,2,9,8,7,6,5,4,3,2], sum, take %11
 * 2nd check digit: multiply digits 1-13 by weights [6,5,4,3,2,9,8,7,6,5,4,3,2], sum, take %11
 * If remainder < 2, check digit is 0; otherwise it's 11 - remainder.
 */
export function isValidCNPJ(cnpj: string) {
	const value = onlyDigits(cnpj);

	if (value.length !== 14 || isRepeatedDigits(value)) {
		return false;
	}

	const calcDigit = (base: string, weights: number[]) => {
		const total = base.split("").reduce((sum, char, index) => {
			const weight = weights[index] ?? 0;
			return sum + Number(char) * weight;
		}, 0);

		const rest = total % 11;
		return rest < 2 ? 0 : 11 - rest;
	};

	const digit1 = calcDigit(
		value.slice(0, 12),
		[5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
	);
	const digit2 = calcDigit(
		value.slice(0, 13),
		[6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
	);

	return digit1 === Number(value[12]) && digit2 === Number(value[13]);
}

export function documentSchema(type: "cpf" | "cnpj") {
	return z.string().superRefine((value, ctx) => {
		if (!shouldValidateDocuments()) {
			return;
		}

		const valid = type === "cpf" ? isValidCPF(value) : isValidCNPJ(value);

		if (!valid) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				message: `${type.toUpperCase()} inválido`,
			});
		}
	});
}
