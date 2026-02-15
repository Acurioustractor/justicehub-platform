import { z } from "zod";

export const nominationSchema = z.object({
  leaderName: z.string().min(2, "Leader name is required"),
  position: z.string().min(2, "Position or title is required"),
  organisation: z.string().min(2, "Organisation is required"),
  category: z.string().min(2, "Category is required"),
  reason: z
    .string()
    .min(10, "Tell us why this matters")
    .max(500, "Keep the reason under 500 characters"),
  submitterEmail: z
    .string()
    .email("Provide a valid email")
    .optional()
    .or(z.literal("")),
});

export type NominationFormValues = z.input<typeof nominationSchema>;

export const bookingSchema = z.object({
  date: z.string().min(4, "Select a date"),
  time: z.string().min(1, "Select a time"),
  groupSize: z.string().min(1, "Select group size"),
  name: z.string().min(2, "Your name is required"),
  email: z.string().email("Provide a valid email"),
  phone: z.string().min(8, "Provide a contact number"),
  contribution: z
    .string()
    .optional()
    .or(z.literal(""))
    .transform((value) => {
      if (!value) return undefined;
      const numeric = Number(value);
      return Number.isNaN(numeric) ? undefined : numeric;
    })
    .refine((value) => value === undefined || (typeof value === "number" && value >= 0), {
      message: "Contribution must be a positive number",
    }),
  accessibilityNeeds: z
    .string()
    .max(400, "Keep accessibility notes under 400 characters")
    .optional()
    .or(z.literal(""))
    .transform((value) => (value ? value : undefined)),
});

export type BookingFormInput = z.input<typeof bookingSchema>;
export type BookingFormValues = z.output<typeof bookingSchema>;
