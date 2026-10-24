import { defineErrors } from "../../../core/utils/errors";

/** @description Error definitions for the parts module */
export const partsErrors = defineErrors({
	PART_COMPANY_NOT_FOUND: {
		code: "company_not_found",
		message: "There's no companies bound to your account",
		status: 404,
	},
	PART_NOT_ALLOWED: {
		code: "not_allowed",
		message: "You are not authorized to access this company.",
		status: 403,
	},
	PART_NOT_FOUND: {
		code: "part_not_found",
		message: "Part not found.",
		status: 404,
	},
	PART_SUPPLIER_NOT_FOUND: {
		code: "part_supplier_not_found",
		message: "The supplier does not exist in this company.",
		status: 400,
	},
	PART_SKU_CONFLICT: {
		code: "part_sku_conflict",
		message: "A part with this SKU already exists in this company.",
		status: 409,
	},
	PART_SALE_PRICE_BELOW_COST: {
		code: "part_sale_price_below_cost",
		message: "The sale price must be greater than or equal to the cost price.",
		status: 400,
	},
	PART_STOCK_INSUFFICIENT: {
		code: "part_stock_insufficient",
		message: "The adjustment would leave the stock below zero.",
		status: 409,
	},
	PART_PAGE_OUT_OF_BOUNDS: {
		code: "page_out_of_bounds",
		message: "The requested page exceeds the total number of pages.",
		status: 416,
	},
});
