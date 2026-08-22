import { cn } from "@/lib/utils";
import type { ButtonHTMLAttributes, HTMLAttributes, InputHTMLAttributes } from "react";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-3xl border border-border/70 bg-surface p-5 shadow-soft",
        className,
      )}
      {...props}
    />
  );
}

type ActionProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "accent" | "ghost" | "outline";
};

export function Action({ className, variant = "primary", ...props }: ActionProps) {
  return (
    <button
      className={cn(
        "inline-flex min-h-13 w-full items-center justify-center rounded-2xl px-5 text-[15px] font-medium tracking-tight transition-all active:scale-[0.985] disabled:opacity-50",
        variant === "primary" && "bg-primary text-primary-foreground shadow-soft",
        variant === "accent" && "bg-accent text-accent-foreground shadow-lift",
        variant === "outline" && "border border-border bg-surface text-foreground",
        variant === "ghost" && "text-muted-foreground",
        className,
      )}
      {...props}
    />
  );
}

export function Field({
  label,
  prefix,
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { label: string; prefix?: string }) {
  return (
    <label className="block">
      <span className="text-[13px] font-medium text-muted-foreground">{label}</span>
      <div className="mt-2 flex items-center gap-2 rounded-2xl border border-border bg-surface px-4 focus-within:border-accent/60">
        {prefix ? (
          <span className="text-[15px] text-muted-foreground">{prefix}</span>
        ) : null}
        <input
          className={cn(
            "min-h-13 w-full bg-transparent text-[16px] tracking-tight outline-none placeholder:text-muted-foreground/60",
            className,
          )}
          {...props}
        />
      </div>
    </label>
  );
}

export function Pill({ className, ...props }: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border border-border/70 bg-muted px-3 py-1 text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground",
        className,
      )}
      {...props}
    />
  );
}
