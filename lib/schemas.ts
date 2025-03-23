import { z } from "zod"

export const movieSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
})

export const scheduleSchema = z.object({
  movieId: z.string().min(1, "Movie selection is required"),
  date: z.date({
    required_error: "Date is required",
    invalid_type_error: "Date is required",
  }),
})

export type MovieFormValues = z.infer<typeof movieSchema>
export type ScheduleFormValues = z.infer<typeof scheduleSchema>

