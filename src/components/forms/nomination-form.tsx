"use client";

import { useState } from "react";
import { nominationSchema, type NominationFormValues } from "@/lib/validation";
import { CTAButton } from "../cta-button";

const categories = [
  "State Politician",
  "Federal Politician",
  "Justice Official",
  "Media Executive",
  "Business Leader",
  "Philanthropist",
  "Community Leader",
];

interface FormState {
  status: "idle" | "submitting" | "success" | "error";
  message?: string;
}

export function NominationForm() {
  const [formValues, setFormValues] = useState<NominationFormValues>({
    leaderName: "",
    position: "",
    organisation: "",
    category: categories[0] ?? "State Politician",
    reason: "",
    submitterEmail: "",
  });
  const [formState, setFormState] = useState<FormState>({ status: "idle" });
  const [errors, setErrors] = useState<Partial<Record<keyof NominationFormValues, string>>>({});

  const updateField = <Field extends keyof NominationFormValues>(
    field: Field,
    value: NominationFormValues[Field],
  ) => {
    setFormValues((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormState({ status: "submitting" });
    setErrors({});

    const validation = nominationSchema.safeParse(formValues);
    if (!validation.success) {
      const fieldErrors = validation.error.flatten().fieldErrors;
      setErrors(fieldErrors as typeof errors);
      setFormState({
        status: "error",
        message: "Please correct the highlighted fields.",
      });
      return;
    }

    try {
      const response = await fetch("/api/nomination", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(validation.data),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message ?? "Submission failed");
      }

      setFormState({
        status: "success",
        message: "Nomination received. We'll share updates soon!",
      });
      setFormValues({
        leaderName: "",
        position: "",
        organisation: "",
        category: categories[0] ?? "State Politician",
        reason: "",
        submitterEmail: "",
      });
    } catch (error) {
      console.error(error);
      setFormState({
        status: "error",
        message:
          error instanceof Error
            ? error.message
            : "Something went wrong sending your nomination.",
      });
    }
  };

  return (
    <form
      id="nominate-form"
      aria-describedby="nominate-feedback"
      className="space-y-4 text-white"
      onSubmit={handleSubmit}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          id="leaderName"
          label="Leader's name *"
          value={formValues.leaderName}
          onChange={(value) => updateField("leaderName", value)}
          error={errors.leaderName}
        />
        <Field
          id="position"
          label="Position / Title *"
          value={formValues.position}
          onChange={(value) => updateField("position", value)}
          error={errors.position}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          id="organisation"
          label="Organisation *"
          value={formValues.organisation}
          onChange={(value) => updateField("organisation", value)}
          error={errors.organisation}
        />
        <SelectField
          id="category"
          label="Category *"
          value={formValues.category}
          onChange={(value) => updateField("category", value)}
          options={categories}
        />
      </div>

      <TextareaField
        id="reason"
        label="Why should they experience this? *"
        value={formValues.reason}
        onChange={(value) => updateField("reason", value)}
        error={errors.reason}
        maxLength={500}
        helperText="Lead with impact, follow with data."
      />

      <Field
        id="submitterEmail"
        label="Your email (optional)"
        type="email"
        value={formValues.submitterEmail ?? ""}
        onChange={(value) => updateField("submitterEmail", value)}
        error={errors.submitterEmail}
        helperText="We only use this for campaign updates and never share without consent."
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <CTAButton
          as="button"
          type="submit"
          className="sm:w-auto"
        >
          {formState.status === "submitting" ? "Submitting..." : "Submit nomination"}
        </CTAButton>
        <p id="nominate-feedback" className="text-sm text-white/80">
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
  maxLength?: number;
};

function TextareaField({ id, label, value, onChange, error, helperText, maxLength }: TextareaFieldProps) {
  const charactersLeft = maxLength ? maxLength - value.length : null;

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
        maxLength={maxLength}
      />
      <div className="flex justify-between text-xs text-white/40">
        {helperText && <span>{helperText}</span>}
        {charactersLeft !== null && <span>{charactersLeft} characters left</span>}
      </div>
      {error && (
        <span id={`${id}-error`} role="alert" className="text-xs text-color-system-red">
          {error}
        </span>
      )}
    </label>
  );
}
