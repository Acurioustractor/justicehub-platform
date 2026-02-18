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

// ── Call It Out (Discrimination Report) ──────────────────────

const SYSTEM_TYPES = [
  'education',
  'health',
  'policing',
  'housing',
  'employment',
  'anti-discrimination',
  'other',
] as const;

const AUSTRALIAN_STATES = ['NSW', 'VIC', 'QLD', 'SA', 'WA', 'TAS', 'NT', 'ACT'] as const;

export const callItOutSchema = z.object({
  systemType: z.enum(SYSTEM_TYPES, {
    errorMap: () => ({ message: 'Select the system where the incident occurred' }),
  }),
  incidentDate: z
    .string()
    .optional()
    .or(z.literal('')),
  suburb: z
    .string()
    .max(200, 'Suburb name is too long')
    .optional()
    .or(z.literal('')),
  postcode: z
    .string()
    .regex(/^\d{4}$/, 'Enter a valid 4-digit postcode')
    .optional()
    .or(z.literal('')),
  state: z
    .enum(AUSTRALIAN_STATES, {
      errorMap: () => ({ message: 'Select a valid state or territory' }),
    })
    .optional()
    .or(z.literal('')),
  description: z
    .string()
    .max(2000, 'Keep the description under 2000 characters')
    .optional()
    .or(z.literal('')),
  contactEmail: z
    .string()
    .email('Provide a valid email')
    .optional()
    .or(z.literal('')),
  consentToAggregate: z.literal(true, {
    errorMap: () => ({ message: 'Consent is required to include your report in aggregated data' }),
  }),
});

export type CallItOutFormValues = z.input<typeof callItOutSchema>;
export { SYSTEM_TYPES, AUSTRALIAN_STATES };
