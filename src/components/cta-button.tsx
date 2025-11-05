import Link from "next/link";
import type { ComponentPropsWithoutRef } from "react";
import clsx from "clsx";

type SharedProps = {
  variant?: "primary" | "secondary" | "ghost" | "accent" | "light";
  fullWidth?: boolean;
  className?: string;
  children: React.ReactNode;
};

type AnchorProps = {
  as?: "a";
} & SharedProps & ComponentPropsWithoutRef<"a">;

type ButtonProps = {
  as: "button";
} & SharedProps & ComponentPropsWithoutRef<"button">;

type CTAButtonProps = AnchorProps | ButtonProps;

export function CTAButton(props: CTAButtonProps) {
  const variant = props.variant ?? "primary";
  const fullWidth = props.fullWidth ?? false;
  const { className, children } = props;

  const baseStyles =
    "inline-flex items-center justify-center gap-2 rounded-md px-6 py-3 text-base font-semibold tracking-tight transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2";

  const variants: Record<typeof variant, string> = {
    primary: "btn-primary focus-visible:outline-white",
    secondary: "border border-white/60 bg-transparent text-white hover:bg-white/10 focus-visible:outline-white",
    ghost: "bg-transparent text-white/85 underline underline-offset-4 hover:text-white focus-visible:outline-white",
    accent: "btn-accent focus-visible:outline-color-warning-orange",
    light: "btn-light focus-visible:outline-color-container-black/30",
  };

  const composedClassName = clsx(
    baseStyles,
    variants[variant],
    fullWidth && "w-full",
    className,
  );

  if (props.as === "button") {
    // eslint-disable-next-line no-unused-vars
    const { as: _as, variant: _variant, fullWidth: _fullWidth, className: _class, children: _children, type, ...buttonProps } = props;
    return (
      <button
        type={type ?? "button"}
        className={composedClassName}
        {...buttonProps}
      >
        {children}
      </button>
    );
  }

  // eslint-disable-next-line no-unused-vars
  const { as: _as, variant: _variant, fullWidth: _fullWidth, className: _class, children: _children, href = "#", ...anchorProps } = props as AnchorProps;

  return (
    <Link href={href} className={composedClassName} {...anchorProps}>
      {children}
    </Link>
  );
}
