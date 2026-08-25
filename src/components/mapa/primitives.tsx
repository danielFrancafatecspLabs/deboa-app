import { cn } from "@/lib/utils";
import { useEffect, useRef, type ReactNode } from "react";

/**
 * Reais inteiros, nunca centavos.
 *
 * Preencher centavos da direita para a esquerda obrigava a digitar 500000
 * para dizer cinco mil, e fazia o primeiro "4" aparecer como R$ 0,04. As
 * quatro perguntas do Mapa já usam esta convenção; ter duas no mesmo produto
 * é como pedir a data em formatos diferentes em cada tela.
 */
export function parseMoney(raw: string) {
  const digits = raw.replace(/\D/g, "");
  if (!digits) return 0;
  return Number(digits);
}

export function maskMoney(value: number) {
  if (!value) return "";
  return new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 0 }).format(Math.round(value));
}

export function MoneyField({
  label,
  hint,
  value,
  onValueChange,
  placeholder = "0",
}: {
  label: string;
  hint?: string;
  value: number;
  onValueChange: (n: number) => void;
  placeholder?: string;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const text = maskMoney(value);

  // Reformatar um input controlado zera o cursor, e no iOS ele cai antes dos
  // dígitos recém-digitados — o campo passa a parecer travado. Valores só
  // crescem por acréscimo, então fixar o cursor no fim resolve.
  useEffect(() => {
    const el = ref.current;
    if (el && document.activeElement === el) {
      const end = el.value.length;
      el.setSelectionRange(end, end);
    }
  }, [text]);

  return (
    <label className="block">
      <span className="text-[13px] font-medium text-muted-foreground">{label}</span>
      <div className="mt-2 flex items-center gap-2 rounded-2xl border border-border bg-surface px-4 focus-within:border-accent/60">
        <span className="text-[15px] text-muted-foreground">R$</span>
        <input
          ref={ref}
          inputMode="numeric"
          placeholder={placeholder}
          value={text}
          onChange={(e) => onValueChange(parseMoney(e.target.value))}
          className="min-h-13 w-full bg-transparent text-[16px] tabular-nums tracking-tight outline-none placeholder:text-muted-foreground/50"
        />
      </div>
      {hint ? (
        <span className="mt-1.5 block text-[12px] leading-relaxed text-muted-foreground">
          {hint}
        </span>
      ) : null}
    </label>
  );
}

export function NumberField({
  label,
  hint,
  value,
  onValueChange,
  suffix,
  placeholder,
}: {
  label: string;
  hint?: string;
  value: number | null;
  onValueChange: (n: number | null) => void;
  suffix?: string;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="text-[13px] font-medium text-muted-foreground">{label}</span>
      <div className="mt-2 flex items-center gap-2 rounded-2xl border border-border bg-surface px-4 focus-within:border-accent/60">
        <input
          inputMode="numeric"
          placeholder={placeholder ?? "0"}
          value={value === null || Number.isNaN(value) ? "" : String(value)}
          onChange={(e) => {
            const digits = e.target.value.replace(/\D/g, "");
            onValueChange(digits ? Number(digits) : null);
          }}
          className="min-h-13 w-full bg-transparent text-[16px] tracking-tight outline-none placeholder:text-muted-foreground/50"
        />
        {suffix ? (
          <span className="text-[13px] text-muted-foreground">{suffix}</span>
        ) : null}
      </div>
      {hint ? (
        <span className="mt-1.5 block text-[12px] leading-relaxed text-muted-foreground">
          {hint}
        </span>
      ) : null}
    </label>
  );
}

export function TextField({
  label,
  value,
  onValueChange,
  placeholder,
}: {
  label: string;
  value: string;
  onValueChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="text-[13px] font-medium text-muted-foreground">{label}</span>
      <input
        value={value}
        placeholder={placeholder}
        onChange={(e) => onValueChange(e.target.value)}
        className="mt-2 min-h-13 w-full rounded-2xl border border-border bg-surface px-4 text-[16px] tracking-tight outline-none focus:border-accent/60 placeholder:text-muted-foreground/50"
      />
    </label>
  );
}

export function SelectField({
  label,
  value,
  options,
  onValueChange,
}: {
  label: string;
  value: string;
  options: readonly string[];
  onValueChange: (v: string) => void;
}) {
  return (
    <label className="block">
      <span className="text-[13px] font-medium text-muted-foreground">{label}</span>
      <select
        value={value}
        onChange={(e) => onValueChange(e.target.value)}
        className="mt-2 min-h-13 w-full appearance-none rounded-2xl border border-border bg-surface px-4 text-[16px] tracking-tight outline-none"
      >
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </label>
  );
}

export function ChoiceGrid({
  options,
  value,
  onSelect,
  columns = 2,
}: {
  options: readonly string[];
  value: string | null;
  onSelect: (v: string) => void;
  columns?: 1 | 2;
}) {
  return (
    <div className={cn("grid gap-2", columns === 2 ? "grid-cols-2" : "grid-cols-1")}>
      {options.map((option) => {
        const active = option === value;
        return (
          <button
            key={option}
            type="button"
            onClick={() => onSelect(option)}
            className={cn(
              "min-h-12 rounded-2xl border px-3 text-[14px] font-medium tracking-tight transition-all active:scale-[0.98]",
              active
                ? "border-accent bg-accent/10 text-accent"
                : "border-border bg-surface text-foreground",
            )}
          >
            {option}
          </button>
        );
      })}
    </div>
  );
}

export function StepDots({ total, current }: { total: number; current: number }) {
  return (
    <div className="flex items-center gap-1.5">
      {Array.from({ length: total }).map((_, i) => (
        <span key={i} className="flex flex-1 items-center gap-1.5">
          <span
            className={cn(
              "h-2 w-2 shrink-0 rounded-full transition-colors",
              i < current
                ? "bg-accent"
                : i === current
                  ? "bg-accent ring-4 ring-accent/15"
                  : "bg-border",
            )}
          />
          {i < total - 1 ? (
            <span
              className={cn(
                "h-px flex-1",
                i < current ? "bg-accent/50" : "bg-border",
              )}
            />
          ) : null}
        </span>
      ))}
    </div>
  );
}

export function Progress({ value, className }: { value: number; className?: string }) {
  return (
    <div className={cn("h-2 w-full overflow-hidden rounded-full bg-muted", className)}>
      <div
        className="h-full rounded-full bg-accent transition-all duration-700"
        style={{ width: `${Math.max(2, Math.min(value, 1) * 100)}%` }}
      />
    </div>
  );
}

export function Stat({
  emoji,
  label,
  value,
  hint,
}: {
  emoji: string;
  label: string;
  value: string;
  hint?: string | undefined;
}) {
  return (
    <div className="rounded-3xl border border-border/70 bg-surface p-4 shadow-soft">
      <span className="text-[15px]">{emoji}</span>
      <p className="mt-1 text-[12px] font-medium uppercase tracking-[0.06em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 text-[21px] font-semibold tracking-[-0.03em]">{value}</p>
      {hint ? <p className="mt-0.5 text-[11px] text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

export function StepShell({
  eyebrow,
  title,
  subtitle,
  children,
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <section className="animate-rise">
      <p className="text-[12px] font-medium uppercase tracking-[0.1em] text-accent">
        {eyebrow}
      </p>
      <h2 className="mt-2 text-[24px] font-semibold leading-tight tracking-[-0.03em]">
        {title}
      </h2>
      {subtitle ? (
        <p className="mt-2 text-[14px] leading-relaxed text-muted-foreground">{subtitle}</p>
      ) : null}
      <div className="mt-6 space-y-4">{children}</div>
    </section>
  );
}
