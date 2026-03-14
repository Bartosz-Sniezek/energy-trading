import z from "zod";
import { problemDetailsSchema } from "../common/problem-details.schema";

const properties = z.object({
  challenge: z.string(),
  expirationDate: z.iso.datetime(),
});

export const accountNotActivatedProblemDetailsSchema =
  problemDetailsSchema.extend({
    properties,
  });
