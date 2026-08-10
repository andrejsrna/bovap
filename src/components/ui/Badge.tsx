import { cn } from "@/lib/utils";

export type BadgeTone = "primary" | "green" | "yellow" | "red" | "gray";

const tones: Record<BadgeTone, string> = {
  primary: "bg-primary-50 text-primary-600",
  green: "bg-green-50 text-green-600",
  yellow: "bg-yellow-50 text-yellow-600",
  red: "bg-red-50 text-red-600",
  gray: "bg-gray-100 text-gray-600",
};

export function Badge({
  tone = "primary",
  className,
  children,
}: {
  tone?: BadgeTone;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
