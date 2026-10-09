"use client";

import type { ReactNode } from "react";
import { useState } from "react";

export function Section({
  title,
  action,
  children,
}: {
  title: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-white/50">
          {title}
        </h2>
        {action}
      </div>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <div className="mb-1.5 flex items-baseline justify-between gap-2">
        <span className="text-sm font-medium text-white/80">{label}</span>
        {hint ? (
          <span className="text-[11px] text-white/35">{hint}</span>
        ) : null}
      </div>
      {children}
    </label>
  );
}

export function ColorField({
  label,
  value,
  onChange,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}) {
  const [draft, setDraft] = useState<string | null>(null);
  const display = draft ?? value;

  const commit = (next: string) => {
    const trimmed = next.trim();
    if (/^#?[0-9a-fA-F]{3}$|^#?[0-9a-fA-F]{6}$/.test(trimmed)) {
      const hex = trimmed.startsWith("#") ? trimmed : `#${trimmed}`;
      onChange(hex.toLowerCase());
    }
    setDraft(null);
  };

  return (
    <div className={disabled ? "pointer-events-none opacity-40" : ""}>
      <Field label={label}>
        <div className="flex items-center gap-2">
          <span className="relative h-9 w-9 shrink-0 overflow-hidden rounded-lg border border-white/15">
            <input
              type="color"
              value={
                /^#[0-9a-fA-F]{6}$/.test(value) ? value : "#000000"
              }
              onChange={(e) => onChange(e.target.value.toLowerCase())}
              className="absolute -left-2 -top-2 h-16 w-16 cursor-pointer border-0 bg-transparent p-0"
              aria-label={label}
            />
          </span>
          <input
            type="text"
            value={display}
            spellCheck={false}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={(e) => commit(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") commit((e.target as HTMLInputElement).value);
            }}
            className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 font-mono text-sm text-white/90 outline-none transition focus:border-indigo-400/60 focus:bg-black/40"
          />
        </div>
      </Field>
    </div>
  );
}

export function Segmented<T extends string>({
  value,
  options,
  onChange,
  columns,
}: {
  value: T;
  options: { value: T; label: string; hint?: string }[];
  onChange: (value: T) => void;
  columns?: number;
}) {
  return (
    <div
      className="grid gap-1.5"
      style={{
        gridTemplateColumns: `repeat(${columns ?? options.length}, minmax(0, 1fr))`,
      }}
    >
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            title={option.hint}
            onClick={() => onChange(option.value)}
            className={`truncate rounded-lg border px-2 py-2 text-xs font-medium capitalize transition ${
              active
                ? "border-indigo-400/70 bg-indigo-500/20 text-white"
                : "border-white/10 bg-white/[0.02] text-white/60 hover:border-white/20 hover:text-white/90"
            }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

export function RangeField({
  label,
  value,
  min,
  max,
  step = 1,
  suffix,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  suffix?: string;
  onChange: (value: number) => void;
}) {
  return (
    <Field label={label} hint={`${value}${suffix ?? ""}`}>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-white/15 accent-indigo-400"
      />
    </Field>
  );
}

export function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="flex w-full items-center justify-between gap-3 rounded-lg border border-white/10 bg-white/[0.02] px-3 py-2 text-left text-sm text-white/80 transition hover:border-white/20"
    >
      <span>{label}</span>
      <span
        className={`relative h-5 w-9 shrink-0 rounded-full transition ${
          checked ? "bg-indigo-500" : "bg-white/20"
        }`}
      >
        <span
          className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all ${
            checked ? "left-4" : "left-0.5"
          }`}
        />
      </span>
    </button>
  );
}
