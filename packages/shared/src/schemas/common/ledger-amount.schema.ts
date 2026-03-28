import z from "zod";

export const ledgerActionAmountSchema = z.number().int().positive();
