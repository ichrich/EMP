import { z } from "zod";

export const ptoRequestSchema = z.object({
  startDate: z.string().min(1, "Укажите дату начала"),
  endDate: z.string().min(1, "Укажите дату окончания"),
  reason: z.string().min(8, "Добавьте короткую причину")
});

export type PtoRequestValues = z.infer<typeof ptoRequestSchema>;
