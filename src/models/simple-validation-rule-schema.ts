import { z } from "zod";

const SimpleValidationRuleSchema = z.union([
  z.object({
    type: z.literal("exists"),
  }),
  z.object({
    type: z.literal("in"),
    values: z.array(z.any()),
  }),
  z.object({
    type: z.literal("between"),
    min: z.number(),
    max: z.number(),
  }),
  z.object({
    type: z.literal("includes"),
    values: z.array(z.any()),
  }),
  z.object({
    type: z.literal("number"),
  }),
  z.object({
    type: z.literal("string"),
  }),
  z.object({
    type: z.literal("boolean"),
  }),
  z.object({
    type: z.literal("gte"),
    value: z.number(),
  }),
  z.object({
    type: z.literal("lte"),
    value: z.number(),
  }),
  z.object({
    type: z.literal("gt"),
    value: z.number(),
  }),
  z.object({
    type: z.literal("lt"),
    value: z.number(),
  }),
  z.object({
    type: z.literal("eq"),
    value: z.any(),
  }),
  z.object({
    type: z.literal("custom"),
    validator: z.function().args(z.any()).returns(z.boolean()),
  }),
]);

export { SimpleValidationRuleSchema };
