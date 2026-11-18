import { cva, type VariantProps } from "class-variance-authority";
import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export const buttonVariants = cva(
  "inline-flex h-11 items-center justify-center gap-2 rounded-md px-4 text-sm font-semibold transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-50",
  {
    variants: {
      variant: {
        primary: "bg-action text-ink hover:bg-navy-soft hover:text-paper",
        secondary: "border border-line bg-card text-ink hover:bg-wash",
        ghost: "bg-transparent text-ink hover:bg-wash",
        navy: "bg-navy text-paper hover:bg-navy-soft",
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
  "h-11 w-full rounded-md border border-line bg-wash px-3 text-sm text-ink";
