import { cva, type VariantProps } from "class-variance-authority";
import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export const buttonVariants = cva(
  "inline-flex h-11 items-center justify-center gap-2 rounded-lg px-4 text-sm font-semibold transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-50",
  {
    variants: {
      variant: {
        primary: "bg-action text-card hover:bg-navy",
        secondary: "border border-line bg-card text-ink hover:bg-paper",
        ghost: "bg-transparent text-ink hover:bg-wash",
        navy: "bg-navy text-card hover:bg-navy-soft",
      },
    },
    defaultVariants: { variant: "primary" },
  },
);

type Props = ButtonHTMLAttributes<HTMLButtonElement> & VariantProps<typeof buttonVariants>;

export function Button({ className, variant, type = "button", ...props }: Props) {
  return <button type={type} className={cn(buttonVariants({ variant }), className)} {...props} />;
}

export const fieldClass =
  "h-11 w-full rounded-lg border border-line bg-card px-3 text-sm text-ink";
