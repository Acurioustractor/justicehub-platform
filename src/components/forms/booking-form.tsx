"use client";

import { useState } from "react";
import { bookingSchema, type BookingFormInput } from "@/lib/validation";
import { CTAButton } from "../cta-button";

const timeSlots = [
  "9:00 AM",
  "10:00 AM",
  "11:00 AM",
  "12:00 PM",
  "1:00 PM",
  "2:00 PM",
  "3:00 PM",
  "4:00 PM",
  "5:00 PM",
];

const groupSizes = ["1", "2", "3", "4", "5+ (group booking)"];

interface FormState {
  status: "idle" | "submitting" | "success" | "error";
  message?: string;
}

export function BookingForm() {
  const [formValues, setFormValues] = useState<BookingFormInput>({
    date: "",
    time: timeSlots[0],
    groupSize: groupSizes[0],
    name: "",
    email: "",
    phone: "",
    contribution: undefined,
    accessibilityNeeds: "",
  });
  const [formState, setFormState] = useState<FormState>({ status: "idle" });
  const [errors, setErrors] = useState<Partial<Record<keyof BookingFormInput, string>>>({});

  const updateField = <Field extends keyof BookingFormInput>(
    field: Field,
    value: BookingFormInput[Field],
  ) => {
    setFormValues((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormState({ status: "submitting" });
    setErrors({});

    const validation = bookingSchema.safeParse(formValues);
    if (!validation.success) {
      const fieldErrors = validation.error.flatten().fieldErrors;
      setErrors(fieldErrors as typeof errors);
      setFormState({
        status: "error",
        message: "Please fix the highlighted fields.",
      });
      return;
    }

    try {
      const response = await fetch("/api/booking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validation.data),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message ?? "Submission failed");
      }

      setFormState({
        status: "success",
        message: "Booking received. We'll confirm within 24 hours.",
      });
      setFormValues({
        date: "",
        time: timeSlots[0],
        groupSize: groupSizes[0],
        name: "",
        email: "",
        phone: "",
        contribution: undefined,
        accessibilityNeeds: "",
      });
    } catch (error) {
      console.error(error);
      setFormState({
        status: "error",
        message:
          error instanceof Error
            ? error.message
            : "Something went wrong sending your booking.",
      });
    }
  };

  return (
    <form
      id="book-form"
      aria-describedby="booking-feedback"
      className="space-y-4 text-white"
      onSubmit={handleSubmit}
    >
      <div className="grid gap-4 sm:grid-cols-3">
        <Field
          id="date"
          type="date"
          label="Select date *"
          value={formValues.date}
          onChange={(value) => updateField("date", value)}
          error={errors.date}
        />
        <SelectField
          id="time"
          label="Select time *"
          value={formValues.time}
          onChange={(value) => updateField("time", value)}
          options={timeSlots}
          error={errors.time}
        />
        <SelectField
          id="groupSize"
          label="Group size *"
          value={formValues.groupSize}
          onChange={(value) => updateField("groupSize", value)}
          options={groupSizes}
          error={errors.groupSize}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          id="name"
          label="Your name *"
          value={formValues.name}
          onChange={(value) => updateField("name", value)}
          error={errors.name}
        />
        <Field
          id="email"
          type="email"
          label="Email *"
          value={formValues.email}
          onChange={(value) => updateField("email", value)}
          error={errors.email}
        />
      </div>

      <Field
        id="phone"
        label="Phone *"
        value={formValues.phone}
        onChange={(value) => updateField("phone", value)}
        error={errors.phone}
        helperText="We use this if a slot changes."
      />

      <Field
        id="contribution"
        type="number"
        label="Contribution ($0-$50)"
        value={formValues.contribution ?? ""}
        onChange={(value) =>
          updateField("contribution", value === "" ? undefined : value)
        }
        error={errors.contribution}
        helperText="Pay what you can; no one is turned away."
      />

      <TextareaField
        id="accessibilityNeeds"
        label="Accessibility, cultural or safety needs"
        value={formValues.accessibilityNeeds ?? ""}
        onChange={(value) => updateField("accessibilityNeeds", value)}
        error={errors.accessibilityNeeds}
        helperText="Tell us how to support you best."
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <CTAButton as="button" type="submit" className="sm:w-auto">
          {formState.status === "submitting" ? "Submitting..." : "Confirm booking"}
        </CTAButton>
        <p id="booking-feedback" className="text-sm text-white/80">
          {formState.status === "success" && formState.message}
          {formState.status === "error" && formState.message}
        </p>
      </div>
    </form>
  );
}

type FieldBaseProps = {
  id: string;
  label: string;
  error?: string;
  helperText?: string;
};

type FieldProps = FieldBaseProps & {
  type?: string;
  value: string;
  onChange: (value: string) => void;
};

function Field({ id, label, type = "text", value, onChange, error, helperText }: FieldProps) {
  return (
    <label className="flex flex-col gap-2 text-sm text-white/88" htmlFor={id}>
      <span>{label}</span>
      <input
        id={id}
        name={id}
        type={type}
        value={value}
        onChange={(event) => onChange(event.currentTarget.value)}
        className="w-full rounded-md border border-white/20 bg-white/12 px-3 py-2 text-base text-white placeholder:text-white/40 focus:border-color-hope-green"
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
      />
      {helperText && <span className="text-xs text-white/40">{helperText}</span>}
      {error && (
        <span id={`${id}-error`} role="alert" className="text-xs text-color-system-red">
          {error}
        </span>
      )}
    </label>
  );
}

type SelectFieldProps = FieldBaseProps & {
  value: string;
  onChange: (value: string) => void;
  options: string[];
};

function SelectField({ id, label, value, onChange, options, error }: SelectFieldProps) {
  return (
    <label className="flex flex-col gap-2 text-sm text-white/88" htmlFor={id}>
      <span>{label}</span>
      <select
        id={id}
        name={id}
        value={value}
        onChange={(event) => onChange(event.currentTarget.value)}
        className="w-full rounded-md border border-white/20 bg-white/12 px-3 py-2 text-base text-white focus:border-color-hope-green"
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
      >
        {options.map((option) => (
          <option key={option}>{option}</option>
        ))}
      </select>
      {error && (
        <span id={`${id}-error`} role="alert" className="text-xs text-color-system-red">
          {error}
        </span>
      )}
    </label>
  );
}

type TextareaFieldProps = FieldBaseProps & {
  value: string;
  onChange: (value: string) => void;
};

function TextareaField({ id, label, value, onChange, error, helperText }: TextareaFieldProps) {
  return (
    <label className="flex flex-col gap-2 text-sm text-white/88" htmlFor={id}>
      <span>{label}</span>
      <textarea
        id={id}
        name={id}
        value={value}
        onChange={(event) => onChange(event.currentTarget.value)}
        className="min-h-[120px] w-full rounded-md border border-white/20 bg-white/12 px-3 py-2 text-base text-white placeholder:text-white/40 focus:border-color-hope-green"
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
      />
      {helperText && <span className="text-xs text-white/40">{helperText}</span>}
      {error && (
        <span id={`${id}-error`} role="alert" className="text-xs text-color-system-red">
          {error}
        </span>
      )}
    </label>
  );
}
