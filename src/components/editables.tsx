import { useEffect, useRef, type ReactNode } from "react";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Building blocks for the screens that are a reading first and a form second.
 *
 * The screen is a reading first and a form second: rows show what DeBoa knows
 * and open into an editor only when tapped. That keeps five numbers legible on
 * a phone instead of stacking five naked inputs, and it makes editing a
 * deliberate act rather than something you do by accident while scrolling.
 */

/* --------------------------------- Group --------------------------------- */

export function Group({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <section className="mt-7">
      <h2 className="px-1 text-[13px] font-medium uppercase tracking-[0.1em] text-muted-foreground">
        {title}
      </h2>
      {hint ? (
        <p className="mt-1.5 px-1 text-[13px] leading-relaxed text-muted-foreground">{hint}</p>
      ) : null}
      <div className="mt-3 overflow-hidden rounded-3xl border border-border/70 bg-surface shadow-soft">
        {children}
      </div>
    </section>
  );
}

/* ------------------------------- Money input ------------------------------ */

/**
 * Whole reais, never centavos — the same convention the Mapa questions use, so
 * a number typed there and corrected here behaves identically.
 */
function format(value: number) {
  return value > 0 ? new Intl.NumberFormat("pt-BR").format(value) : "";
}

function MoneyInput({
  value,
  onValueChange,
}: {
  value: number;
  onValueChange: (n: number) => void;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const text = format(value);

  useEffect(() => {
    ref.current?.focus();
  }, []);

  // Reformatting a controlled input resets the caret, and on iOS it lands
  // before the digits just typed. Amounts are only appended to, so pinning it
  // to the end is both correct and enough.
  useEffect(() => {
    const el = ref.current;
    if (el && document.activeElement === el) {
      const end = el.value.length;
      el.setSelectionRange(end, end);
    }
  }, [text]);

  return (
    <div className="flex items-baseline gap-2 border-b border-border pb-2 focus-within:border-accent">
      <span className="text-[17px] font-medium text-muted-foreground">R$</span>
      <input
        ref={ref}
        inputMode="numeric"
        placeholder="0"
        value={text}
        onChange={(e) => onValueChange(Number(e.target.value.replace(/\D/g, "")) || 0)}
        className="w-full bg-transparent text-[30px] font-semibold tracking-[-0.03em] tabular-nums outline-none placeholder:text-muted-foreground/30"
      />
    </div>
  );
}

/* ---------------------------------- Rows ---------------------------------- */

type RowProps = {
  label: string;
  /** The value as it reads when the row is closed. */
  value: string;
  /**
   * What this number does to DeBoa's reading, recomputed from the profile as
   * it is edited. This is the point of the screen: a number you can change
   * without seeing its consequence is just data entry.
   */
  consequence?: ReactNode;
  open: boolean;
  onToggle: () => void;
  children: ReactNode;
};

export function EditRow({ label, value, consequence, open, onToggle, children }: RowProps) {
  return (
    <div className="border-b border-border/60 last:border-b-0">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center gap-3 px-5 py-4 text-left transition-colors active:bg-muted/50"
      >
        <span className="min-w-0 flex-1">
          <span className="block text-[14px] tracking-tight text-muted-foreground">{label}</span>
          {/* While the row is open the editor below shows the value, larger.
              Repeating it in the header just makes the same number twice. */}
          {open ? null : (
            <span className="mt-0.5 block text-[19px] font-semibold tracking-[-0.02em] tabular-nums">
              {value}
            </span>
          )}
        </span>
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200",
            open && "rotate-180",
          )}
        />
      </button>

      {open ? (
        <div className="animate-rise px-5 pb-5">
          {children}
          {consequence ? (
            <div className="mt-4 flex gap-2.5 rounded-2xl border border-accent/25 bg-accent/6 p-3.5">
              <span className="mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded-full bg-accent text-accent-foreground">
                <Check className="h-2.5 w-2.5" strokeWidth={3.5} />
              </span>
              <p className="text-[13px] leading-relaxed">{consequence}</p>
            </div>
          ) : null}
          <button
            type="button"
            onClick={onToggle}
            className="mt-4 w-full rounded-2xl border border-border bg-surface py-2.5 text-[14px] font-medium tracking-tight transition-all active:scale-[0.985]"
          >
            Pronto
          </button>
        </div>
      ) : null}
    </div>
  );
}

/** An EditRow whose editor is a single money amount. */
export function MoneyRow({
  label,
  amount,
  onAmountChange,
  consequence,
  open,
  onToggle,
  extra,
}: {
  label: string;
  amount: number;
  onAmountChange: (n: number) => void;
  consequence?: ReactNode;
  open: boolean;
  onToggle: () => void;
  /** Anything that belongs under the amount, like a day picker. */
  extra?: ReactNode;
}) {
  return (
    <EditRow
      label={label}
      value={amount > 0 ? `R$ ${format(amount)}` : "—"}
      consequence={consequence}
      open={open}
      onToggle={onToggle}
    >
      <MoneyInput value={amount} onValueChange={onAmountChange} />
      {extra ? <div className="mt-5">{extra}</div> : null}
    </EditRow>
  );
}

/**
 * A number DeBoa worked out rather than one you told it. Kept visually
 * distinct from the editable rows so it is always clear which is which.
 */
export function ReadRow({
  label,
  value,
  hint,
  action,
}: {
  label: string;
  value: string;
  hint?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="border-b border-border/60 px-5 py-4 last:border-b-0">
      <div className="flex items-baseline gap-3">
        <span className="min-w-0 flex-1 text-[14px] tracking-tight text-muted-foreground">
          {label}
        </span>
        <span className="shrink-0 text-[17px] font-semibold tracking-[-0.02em] tabular-nums">
          {value}
        </span>
      </div>
      {hint ? (
        <p className="mt-1 text-[12.5px] leading-relaxed text-muted-foreground">{hint}</p>
      ) : null}
      {action ? <div className="mt-3">{action}</div> : null}
    </div>
  );
}

/* ------------------------------- Day picker ------------------------------- */

export function DayPicker({
  value,
  onSelect,
}: {
  value: number | null;
  onSelect: (day: number | null) => void;
}) {
  return (
    <div>
      <p className="text-[13px] font-medium text-muted-foreground">Que dia costuma cair?</p>
      <div className="mt-2.5 flex flex-wrap gap-2">
        {[1, 5, 10, 15, 20, 30].map((day) => (
          <button
            key={day}
            type="button"
            onClick={() => onSelect(day)}
            className={cn(
              "min-w-11 rounded-full border px-3 py-1.5 text-[13px] font-medium tabular-nums transition-all active:scale-[0.97]",
              value === day
                ? "border-accent bg-accent/10 text-accent"
                : "border-border bg-surface",
            )}
          >
            {day}
          </button>
        ))}
        <button
          type="button"
          onClick={() => onSelect(null)}
          className={cn(
            "rounded-full border px-3 py-1.5 text-[13px] font-medium transition-all active:scale-[0.97]",
            value === null ? "border-accent bg-accent/10 text-accent" : "border-border bg-surface",
          )}
        >
          Varia
        </button>
      </div>
    </div>
  );
}
