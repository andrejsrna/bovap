import Link from "next/link";
import type { ButtonHTMLAttributes, AnchorHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "soft" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

const base =
  "inline-flex items-center justify-center gap-1.5 rounded-lg border text-center font-medium transition-all focus:ring focus:outline-none disabled:cursor-not-allowed";

const variants: Record<Variant, string> = {
  primary:
    "border-primary-500 bg-primary-500 text-white shadow-sm hover:border-primary-700 hover:bg-primary-700 focus:ring-primary-200 disabled:border-primary-300 disabled:bg-primary-300",
  secondary:
    "border-gray-300 bg-white text-gray-700 shadow-sm hover:bg-gray-100 focus:ring-gray-100 disabled:border-gray-100 disabled:bg-gray-50 disabled:text-gray-400",
  soft: "border-primary-100 bg-primary-100 text-primary-600 hover:border-primary-200 hover:bg-primary-200 focus:ring-primary-50 disabled:border-primary-50 disabled:bg-primary-50 disabled:text-primary-400",
  ghost:
    "border-transparent bg-transparent text-gray-700 shadow-none hover:bg-gray-100 disabled:bg-transparent disabled:text-gray-400",
  danger:
    "border-red-500 bg-red-500 text-white shadow-sm hover:border-red-700 hover:bg-red-700 focus:ring-red-200 disabled:border-red-300 disabled:bg-red-300",
};

const sizes: Record<Size, string> = {
  sm: "px-3 py-1.5 text-xs",
  md: "px-5 py-2.5 text-sm",
  lg: "px-6 py-3 text-base",
};

export function Button({
  variant = "primary",
  size = "md",
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
}) {
  return (
    <button
      className={cn(base, variants[variant], sizes[size], className)}
      {...props}
    />
  );
}

export function ButtonLink({
  variant = "primary",
  size = "md",
  className,
  ...props
}: Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & {
  href: string;
  variant?: Variant;
  size?: Size;
}) {
  return (
    <Link
      className={cn(base, variants[variant], sizes[size], className)}
      {...props}
    />
  );
}
