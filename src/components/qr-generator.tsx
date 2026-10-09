"use client";

import type QRCodeStylingType from "qr-code-styling";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Check,
  Copy,
  Download,
  ImagePlus,
  Infinity as InfinityIcon,
  Link2,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Trash2,
  TriangleAlert,
  Upload,
} from "lucide-react";
import {
  ColorField,
  Field,
  RangeField,
  Section,
  Segmented,
  Toggle,
} from "./controls";
import { PRESETS } from "@/lib/presets";
import {
  CORNER_DOT_TYPES,
  CORNER_SQUARE_TYPES,
  DEFAULT_CONFIG,
  DOT_TYPES,
  EC_LEVELS,
  buildGradientCss,
  buildOptions,
  contrastRatio,
  loadConfig,
  normalizeUrl,
  sanitizeName,
  saveConfig,
  type QrConfig,
} from "@/lib/qr";

type Extension = "png" | "jpeg" | "webp" | "svg";

const EXTENSIONS: { value: Extension; label: string }[] = [
  { value: "png", label: "PNG" },
  { value: "svg", label: "SVG" },
  { value: "jpeg", label: "JPG" },
  { value: "webp", label: "WEBP" },
];

export function QrGenerator() {
  const [config, setConfig] = useState<QrConfig>(DEFAULT_CONFIG);
  const [ready, setReady] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [busyExt, setBusyExt] = useState<Extension | null>(null);
  const [dragging, setDragging] = useState(false);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const qrRef = useRef<QRCodeStylingType | null>(null);
  const configRef = useRef(config);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const flash = useCallback((message: string) => {
    setToast(message);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2200);
  }, []);

  const patch = useCallback((partial: Partial<QrConfig>) => {
    setConfig((current) => ({ ...current, ...partial }));
  }, []);

  useEffect(() => {
    configRef.current = config;
  }, [config]);

  useEffect(() => {
    // Hydration-safe: server renders defaults, then we restore saved settings.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setConfig(loadConfig());
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => saveConfig(config), 300);
    return () => clearTimeout(timer);
  }, [config]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const mod = await import("qr-code-styling");
      if (cancelled) return;
      const QRCodeStyling = mod.default;
      const instance = new QRCodeStyling(buildOptions(configRef.current));
      qrRef.current = instance;
      const container = containerRef.current;
      if (container) {
        container.innerHTML = "";
        instance.append(container);
      }
      setReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!qrRef.current || !ready) return;
    qrRef.current.update(buildOptions(config));
  }, [config, ready]);

  const normalized = useMemo(() => normalizeUrl(config.data), [config.data]);
  const wasNormalized = normalized !== config.data.trim() && config.data.trim() !== "";

  const contrast = useMemo(() => {
    if (config.fgMode === "solid" && config.bgMode === "solid") {
      return contrastRatio(config.fgColor, config.bgColor);
    }
    return null;
  }, [config.fgMode, config.bgMode, config.fgColor, config.bgColor]);

  const lowContrast = contrast !== null && contrast < 3;

  const getBlob = useCallback(async (ext: Extension): Promise<Blob | null> => {
    const qr = qrRef.current;
    if (!qr) return null;
    const raw = await qr.getRawData(ext);
    if (!raw) return null;
    if (raw instanceof Blob) return raw;
    return new Blob([raw as unknown as BlobPart], {
      type: ext === "svg" ? "image/svg+xml" : `image/${ext}`,
    });
  }, []);

  const download = useCallback(
    async (ext: Extension) => {
      setBusyExt(ext);
      try {
        const blob = await getBlob(ext);
        if (!blob) {
          flash("Could not generate the file");
          return;
        }
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement("a");
        anchor.href = url;
        anchor.download = `${sanitizeName(config.data)}.${ext}`;
        document.body.appendChild(anchor);
        anchor.click();
        anchor.remove();
        URL.revokeObjectURL(url);
        flash(`${ext.toUpperCase()} downloaded`);
      } catch {
        flash("Download failed");
      } finally {
        setBusyExt(null);
      }
    },
    [config.data, flash, getBlob],
  );

  const copyImage = useCallback(async () => {
    try {
      const blob = await getBlob("png");
      if (!blob || typeof ClipboardItem === "undefined") {
        flash("Clipboard not supported here");
        return;
      }
      await navigator.clipboard.write([
        new ClipboardItem({ "image/png": blob }),
      ]);
      flash("PNG copied to clipboard");
    } catch {
      flash("Clipboard not supported here");
    }
  }, [flash, getBlob]);

  const handleLogoFile = useCallback(
    (file?: File | null) => {
      if (!file) return;
      if (!file.type.startsWith("image/")) {
        flash("Please choose an image file");
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = String(reader.result);
        setConfig((current) => ({
          ...current,
          logo: dataUrl,
          ecLevel: current.ecLevel === "L" ? "H" : current.ecLevel,
        }));
        flash("Logo added");
      };
      reader.readAsDataURL(file);
    },
    [flash],
  );

  const applyPreset = useCallback((partial: Partial<QrConfig>) => {
    setConfig((current) => ({ ...current, ...partial }));
  }, []);

  const reset = useCallback(() => {
    setConfig((current) => ({
      ...DEFAULT_CONFIG,
      data: current.data,
      logo: null,
    }));
    flash("Styles reset");
  }, [flash]);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 pb-16 pt-6 sm:px-6">
      <Header />

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,380px)]">
        <div className="space-y-5 lg:col-start-1 lg:row-start-1">
          <Section title="Destination">
            <Field
              label="URL"
              hint={wasNormalized ? `→ ${normalized}` : undefined}
            >
              <div className="relative">
                <Link2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" />
                <input
                  type="url"
                  inputMode="url"
                  value={config.data}
                  onChange={(e) => patch({ data: e.target.value })}
                  placeholder="https://your-website.com"
                  spellCheck={false}
                  autoComplete="off"
                  className="w-full rounded-xl border border-white/10 bg-black/30 py-3 pl-9 pr-3 text-sm text-white/90 outline-none transition placeholder:text-white/25 focus:border-indigo-400/60 focus:bg-black/40"
                />
              </div>
            </Field>
            <p className="flex items-start gap-2 rounded-xl border border-emerald-400/15 bg-emerald-400/[0.06] p-3 text-xs leading-relaxed text-emerald-200/80">
              <InfinityIcon className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" />
              <span>
                Static QR — your URL is encoded directly into the pattern. It
                works forever, needs no server, and never expires.
              </span>
            </p>
          </Section>

          <Section
            title="Presets"
            action={
              <button
                type="button"
                onClick={reset}
                className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 px-2.5 py-1.5 text-xs text-white/60 transition hover:border-white/25 hover:text-white"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Reset
              </button>
            }
          >
            <div className="grid grid-cols-4 gap-2 sm:grid-cols-8">
              {PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  title={preset.name}
                  onClick={() => applyPreset(preset.config)}
                  className="group flex flex-col items-center gap-1.5"
                >
                  <span
                    className="h-10 w-full rounded-lg border border-white/15 transition group-hover:scale-105 group-hover:border-white/40"
                    style={{ background: preset.swatch }}
                  />
                  <span className="text-[10px] text-white/50">
                    {preset.name}
                  </span>
                </button>
              ))}
            </div>
          </Section>

          <Section title="Shape & pattern">
            <Field label="Module style">
              <Segmented
                value={config.dotType}
                columns={3}
                options={DOT_TYPES.map((value) => ({
                  value,
                  label: value.replace("-", " "),
                }))}
                onChange={(dotType) => patch({ dotType })}
              />
            </Field>
            <Field label="Overall shape">
              <Segmented
                value={config.shape}
                options={[
                  { value: "square", label: "Square" },
                  { value: "circle", label: "Circle" },
                ]}
                onChange={(shape) => patch({ shape })}
              />
            </Field>
            <RangeField
              label="Size"
              value={config.size}
              min={256}
              max={2048}
              step={64}
              suffix="px"
              onChange={(size) => patch({ size })}
            />
            <RangeField
              label="Quiet zone (margin)"
              value={config.margin}
              min={0}
              max={96}
              suffix="px"
              onChange={(margin) => patch({ margin })}
            />
          </Section>

          <Section title="Foreground">
            <Field label="Fill">
              <Segmented
                value={config.fgMode}
                options={[
                  { value: "solid", label: "Solid colour" },
                  { value: "gradient", label: "Gradient" },
                ]}
                onChange={(fgMode) => patch({ fgMode })}
              />
            </Field>

            {config.fgMode === "solid" ? (
              <ColorField
                label="Colour"
                value={config.fgColor}
                onChange={(fgColor) => patch({ fgColor })}
              />
            ) : (
              <div className="space-y-4">
                <div
                  className="h-9 w-full rounded-lg border border-white/15"
                  style={{ background: buildGradientCss(config, "fg") }}
                />
                <div className="grid grid-cols-2 gap-3">
                  <ColorField
                    label="From"
                    value={config.fgGradientFrom}
                    onChange={(fgGradientFrom) => patch({ fgGradientFrom })}
                  />
                  <ColorField
                    label="To"
                    value={config.fgGradientTo}
                    onChange={(fgGradientTo) => patch({ fgGradientTo })}
                  />
                </div>
                <Field label="Type">
                  <Segmented
                    value={config.fgGradientType}
                    options={[
                      { value: "linear", label: "Linear" },
                      { value: "radial", label: "Radial" },
                    ]}
                    onChange={(fgGradientType) =>
                      patch({ fgGradientType })
                    }
                  />
                </Field>
                {config.fgGradientType === "linear" ? (
                  <RangeField
                    label="Angle"
                    value={config.fgGradientRotation}
                    min={0}
                    max={360}
                    step={15}
                    suffix="°"
                    onChange={(fgGradientRotation) =>
                      patch({ fgGradientRotation })
                    }
                  />
                ) : null}
              </div>
            )}

            <Field label="Corner colours">
              <Segmented
                value={config.cornerMode}
                options={[
                  { value: "match", label: "Match pattern" },
                  { value: "custom", label: "Custom" },
                ]}
                onChange={(cornerMode) => patch({ cornerMode })}
              />
            </Field>

            {config.cornerMode === "custom" ? (
              <div className="grid grid-cols-2 gap-3">
                <ColorField
                  label="Corner frame"
                  value={config.cornerColor}
                  onChange={(cornerColor) => patch({ cornerColor })}
                />
                <ColorField
                  label="Corner dot"
                  value={config.cornerDotColor}
                  onChange={(cornerDotColor) => patch({ cornerDotColor })}
                />
              </div>
            ) : null}

            <div className="grid grid-cols-2 gap-3">
              <Field label="Corner frame">
                <Segmented
                  value={config.cornerSquareType}
                  columns={3}
                  options={CORNER_SQUARE_TYPES.map((value) => ({
                    value,
                    label: value.replace("-", " "),
                  }))}
                  onChange={(cornerSquareType) => patch({ cornerSquareType })}
                />
              </Field>
              <Field label="Corner dot">
                <Segmented
                  value={config.cornerDotType}
                  options={CORNER_DOT_TYPES.map((value) => ({
                    value,
                    label: value,
                  }))}
                  onChange={(cornerDotType) => patch({ cornerDotType })}
                />
              </Field>
            </div>
          </Section>

          <Section title="Background">
            <Field label="Fill">
              <Segmented
                value={config.bgMode}
                columns={3}
                options={[
                  { value: "solid", label: "Solid" },
                  { value: "gradient", label: "Gradient" },
                  { value: "transparent", label: " None" },
                ]}
                onChange={(bgMode) => patch({ bgMode })}
              />
            </Field>

            {config.bgMode === "solid" ? (
              <ColorField
                label="Colour"
                value={config.bgColor}
                onChange={(bgColor) => patch({ bgColor })}
              />
            ) : null}

            {config.bgMode === "gradient" ? (
              <div className="space-y-4">
                <div
                  className="h-9 w-full rounded-lg border border-white/15"
                  style={{ background: buildGradientCss(config, "bg") }}
                />
                <div className="grid grid-cols-2 gap-3">
                  <ColorField
                    label="From"
                    value={config.bgGradientFrom}
                    onChange={(bgGradientFrom) => patch({ bgGradientFrom })}
                  />
                  <ColorField
                    label="To"
                    value={config.bgGradientTo}
                    onChange={(bgGradientTo) => patch({ bgGradientTo })}
                  />
                </div>
                <Field label="Type">
                  <Segmented
                    value={config.bgGradientType}
                    options={[
                      { value: "linear", label: "Linear" },
                      { value: "radial", label: "Radial" },
                    ]}
                    onChange={(bgGradientType) =>
                      patch({ bgGradientType })
                    }
                  />
                </Field>
                {config.bgGradientType === "linear" ? (
                  <RangeField
                    label="Angle"
                    value={config.bgGradientRotation}
                    min={0}
                    max={360}
                    step={15}
                    suffix="°"
                    onChange={(bgGradientRotation) =>
                      patch({ bgGradientRotation })
                    }
                  />
                ) : null}
              </div>
            ) : null}

            {config.bgMode === "transparent" ? (
              <p className="text-xs text-white/40">
                Transparent backgrounds look best in PNG and SVG.
              </p>
            ) : null}
          </Section>

          <Section title="Logo">
            {config.logo ? (
              <div className="space-y-4">
                <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-black/20 p-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={config.logo}
                    alt="Logo preview"
                    className="h-12 w-12 rounded-lg border border-white/10 bg-white/5 object-contain"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm text-white/80">
                      Logo in centre
                    </p>
                    <p className="text-xs text-white/40">
                      Error correction keeps it scannable
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => patch({ logo: null })}
                    className="rounded-lg border border-white/10 p-2 text-white/50 transition hover:border-red-400/40 hover:text-red-300"
                    aria-label="Remove logo"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <RangeField
                  label="Logo size"
                  value={Math.round(config.logoSize * 100)}
                  min={10}
                  max={60}
                  suffix="%"
                  onChange={(v) => patch({ logoSize: v / 100 })}
                />
                <RangeField
                  label="Logo padding"
                  value={config.logoMargin}
                  min={0}
                  max={40}
                  suffix="px"
                  onChange={(logoMargin) => patch({ logoMargin })}
                />
                <Toggle
                  label="Clear dots behind logo"
                  checked={config.logoHideDots}
                  onChange={(logoHideDots) => patch({ logoHideDots })}
                />
              </div>
            ) : (
              <label
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragging(true);
                }}
                onDragLeave={() => setDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragging(false);
                  handleLogoFile(e.dataTransfer.files?.[0]);
                }}
                className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed p-6 text-center transition ${
                  dragging
                    ? "border-indigo-400/70 bg-indigo-500/10"
                    : "border-white/15 bg-white/[0.02] hover:border-white/30"
                }`}
              >
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    handleLogoFile(e.target.files?.[0]);
                    e.target.value = "";
                  }}
                />
                <span className="grid h-11 w-11 place-items-center rounded-full bg-white/5">
                  <ImagePlus className="h-5 w-5 text-white/60" />
                </span>
                <span className="text-sm text-white/70">
                  Drop an image or click to upload
                </span>
                <span className="text-xs text-white/35">
                  PNG, JPG, SVG or WEBP — kept in your browser only
                </span>
              </label>
            )}

            <Field
              label="Error correction"
              hint={
                EC_LEVELS.find((l) => l.value === config.ecLevel)?.hint
              }
            >
              <Segmented
                value={config.ecLevel}
                options={EC_LEVELS.map((level) => ({
                  value: level.value,
                  label: level.label,
                  hint: level.hint,
                }))}
                onChange={(ecLevel) => patch({ ecLevel })}
              />
            </Field>
          </Section>
        </div>

        <div className="lg:col-start-2 lg:row-start-1">
          <div className="lg:sticky lg:top-6">
            <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-4 shadow-2xl shadow-black/40 backdrop-blur">
              <div
                className="relative aspect-square w-full overflow-hidden rounded-2xl"
                style={
                  config.bgMode === "transparent"
                    ? {
                        backgroundImage:
                          "linear-gradient(45deg,#334155 25%,transparent 25%),linear-gradient(-45deg,#334155 25%,transparent 25%),linear-gradient(45deg,transparent 75%,#334155 75%),linear-gradient(-45deg,transparent 75%,#334155 75%)",
                        backgroundSize: "20px 20px",
                        backgroundPosition:
                          "0 0,0 10px,10px -10px,-10px 0",
                        backgroundColor: "#1e293b",
                      }
                    : undefined
                }
              >
                <div
                  ref={containerRef}
                  className="flex h-full w-full items-center justify-center [&>canvas]:h-full [&>canvas]:w-full [&>canvas]:object-contain [&>svg]:h-full [&>svg]:w-full"
                />
                {!ready ? (
                  <div className="absolute inset-0 grid place-items-center text-sm text-white/40">
                    Loading preview…
                  </div>
                ) : null}
              </div>

              <div className="mt-3 flex items-center gap-2 rounded-xl border border-white/10 bg-black/20 px-3 py-2">
                <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-400" />
                <span className="truncate text-xs text-white/50">
                  {normalized || "Enter a URL to begin"}
                </span>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2">
                {EXTENSIONS.map((ext) => (
                  <button
                    key={ext.value}
                    type="button"
                    disabled={!ready || busyExt !== null}
                    onClick={() => download(ext.value)}
                    className={`inline-flex items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50 ${
                      ext.value === "png"
                        ? "border-indigo-400/40 bg-indigo-500/20 text-white hover:bg-indigo-500/30"
                        : "border-white/10 bg-white/[0.03] text-white/75 hover:border-white/25 hover:text-white"
                    }`}
                  >
                    <Download className="h-4 w-4" />
                    {busyExt === ext.value ? "…" : ext.label}
                  </button>
                ))}
              </div>

              <button
                type="button"
                disabled={!ready}
                onClick={copyImage}
                className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5 text-sm font-medium text-white/75 transition hover:border-white/25 hover:text-white disabled:opacity-50"
              >
                <Copy className="h-4 w-4" />
                Copy image
              </button>

              {lowContrast ? (
                <p className="mt-3 flex items-start gap-2 rounded-xl border border-amber-400/20 bg-amber-400/10 p-3 text-xs text-amber-200/90">
                  <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" />
                  Low contrast between colours — the QR may be hard to scan.
                  Try darker foreground or lighter background.
                </p>
              ) : null}

              <p className="mt-3 flex items-start gap-2 text-[11px] leading-relaxed text-white/35">
                <Upload className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                Everything runs in your browser. Your URL and logo are never
                uploaded anywhere.
              </p>
            </div>
          </div>
        </div>
      </div>

      {toast ? (
        <div className="pointer-events-none fixed bottom-6 left-1/2 z-50 -translate-x-1/2">
          <div className="flex items-center gap-2 rounded-full border border-white/15 bg-slate-900/95 px-4 py-2 text-sm text-white shadow-xl backdrop-blur">
            <Check className="h-4 w-4 text-emerald-400" />
            {toast}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function Header() {
  return (
    <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3">
        <span className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-indigo-500 to-sky-500 shadow-lg shadow-indigo-500/30">
          <Sparkles className="h-5 w-5 text-white" />
        </span>
        <div>
          <h1 className="text-lg font-semibold tracking-tight text-white">
            QR Studio
          </h1>
          <p className="text-xs text-white/45">
            Beautiful, permanent QR codes for any link
          </p>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1.5 text-xs font-medium text-emerald-200">
          <InfinityIcon className="h-3.5 w-3.5" />
          Never expires
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs font-medium text-white/60">
          <ShieldCheck className="h-3.5 w-3.5" />
          Runs 100% in-browser
        </span>
      </div>
    </header>
  );
}
