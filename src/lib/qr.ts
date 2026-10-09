import type {
  CornerDotType,
  CornerSquareType,
  DotType,
  ErrorCorrectionLevel,
  Gradient,
  GradientType,
  Options,
} from "qr-code-styling";

export type EcLevel = ErrorCorrectionLevel;

export interface QrConfig {
  data: string;

  size: number;
  margin: number;
  shape: "square" | "circle";
  ecLevel: EcLevel;

  dotType: DotType;
  fgMode: "solid" | "gradient";
  fgColor: string;
  fgGradientType: GradientType;
  fgGradientFrom: string;
  fgGradientTo: string;
  fgGradientRotation: number;

  cornerSquareType: CornerSquareType;
  cornerDotType: CornerDotType;
  cornerMode: "match" | "custom";
  cornerColor: string;
  cornerDotColor: string;

  bgMode: "solid" | "gradient" | "transparent";
  bgColor: string;
  bgGradientType: GradientType;
  bgGradientFrom: string;
  bgGradientTo: string;
  bgGradientRotation: number;

  logo: string | null;
  logoSize: number;
  logoMargin: number;
  logoHideDots: boolean;
}

export const DEFAULT_CONFIG: QrConfig = {
  data: "https://vercel.com",

  size: 1024,
  margin: 24,
  shape: "square",
  ecLevel: "Q",

  dotType: "rounded",
  fgMode: "solid",
  fgColor: "#111827",
  fgGradientType: "linear",
  fgGradientFrom: "#6366f1",
  fgGradientTo: "#0ea5e9",
  fgGradientRotation: 45,

  cornerSquareType: "extra-rounded",
  cornerDotType: "dot",
  cornerMode: "match",
  cornerColor: "#111827",
  cornerDotColor: "#111827",

  bgMode: "solid",
  bgColor: "#ffffff",
  bgGradientType: "linear",
  bgGradientFrom: "#ffffff",
  bgGradientTo: "#e0e7ff",
  bgGradientRotation: 45,

  logo: null,
  logoSize: 0.4,
  logoMargin: 8,
  logoHideDots: true,
};

export const DOT_TYPES: DotType[] = [
  "square",
  "rounded",
  "dots",
  "classy",
  "classy-rounded",
  "extra-rounded",
];

export const CORNER_SQUARE_TYPES: CornerSquareType[] = [
  "square",
  "dot",
  "extra-rounded",
];

export const CORNER_DOT_TYPES: CornerDotType[] = ["square", "dot"];

export const EC_LEVELS: { value: EcLevel; label: string; hint: string }[] = [
  { value: "L", label: "L", hint: "Low (~7%) — smallest code" },
  { value: "M", label: "M", hint: "Medium (~15%)" },
  { value: "Q", label: "Q", hint: "Quartile (~25%) — recommended" },
  { value: "H", label: "H", hint: "High (~30%) — best with a logo" },
];

export const FONT = "var(--font-geist-sans), system-ui, sans-serif";

export function normalizeUrl(raw: string): string {
  const value = raw.trim();
  if (!value) return "";
  if (/^[a-z][a-z\d+.-]*:\/\//i.test(value)) return value;
  if (/^(mailto:|tel:|sms:|geo:)/i.test(value)) return value;
  return `https://${value}`;
}

function gradient(
  type: GradientType,
  from: string,
  to: string,
  rotationDeg: number,
): Gradient {
  return {
    type,
    rotation: (rotationDeg * Math.PI) / 180,
    colorStops: [
      { offset: 0, color: from },
      { offset: 1, color: to },
    ],
  };
}

function fgPaint(c: QrConfig) {
  if (c.fgMode === "gradient") {
    return {
      color: undefined,
      gradient: gradient(
        c.fgGradientType,
        c.fgGradientFrom,
        c.fgGradientTo,
        c.fgGradientRotation,
      ),
    };
  }
  return { color: c.fgColor, gradient: undefined };
}

export function buildOptions(c: QrConfig): Partial<Options> {
  const cornerSquarePaint =
    c.cornerMode === "custom"
      ? { color: c.cornerColor, gradient: undefined }
      : fgPaint(c);
  const cornerDotPaint =
    c.cornerMode === "custom"
      ? { color: c.cornerDotColor, gradient: undefined }
      : fgPaint(c);

  let background: Options["backgroundOptions"];
  if (c.bgMode === "transparent") {
    background = { color: "transparent", gradient: undefined, round: 0 };
  } else if (c.bgMode === "gradient") {
    background = {
      color: undefined,
      gradient: gradient(
        c.bgGradientType,
        c.bgGradientFrom,
        c.bgGradientTo,
        c.bgGradientRotation,
      ),
      round: 0,
    };
  } else {
    background = { color: c.bgColor, gradient: undefined, round: 0 };
  }

  return {
    width: c.size,
    height: c.size,
    type: "canvas",
    shape: c.shape,
    margin: Math.min(c.margin, c.size),
    data: normalizeUrl(c.data) || "https://example.com",
    image: c.logo ?? undefined,
    qrOptions: {
      errorCorrectionLevel: c.ecLevel,
    },
    imageOptions: {
      hideBackgroundDots: c.logoHideDots,
      imageSize: c.logoSize,
      margin: c.logoMargin,
      crossOrigin: "anonymous",
    },
    dotsOptions: {
      type: c.dotType,
      ...fgPaint(c),
    },
    cornersSquareOptions: {
      type: c.cornerSquareType,
      ...cornerSquarePaint,
    },
    cornersDotOptions: {
      type: c.cornerDotType,
      ...cornerDotPaint,
    },
    backgroundOptions: background,
  };
}

export function buildGradientCss(c: QrConfig, kind: "fg" | "bg"): string {
  const type = kind === "fg" ? c.fgGradientType : c.bgGradientType;
  const from = kind === "fg" ? c.fgGradientFrom : c.bgGradientFrom;
  const to = kind === "fg" ? c.fgGradientTo : c.bgGradientTo;
  const rotation = kind === "fg" ? c.fgGradientRotation : c.bgGradientRotation;
  if (type === "radial") {
    return `radial-gradient(circle at 50% 50%, ${from} 0%, ${to} 100%)`;
  }
  return `linear-gradient(${rotation}deg, ${from} 0%, ${to} 100%)`;
}

export function parseHex(hex: string): [number, number, number] | null {
  const value = hex.replace("#", "").trim();
  if (!/^[0-9a-f]{3}$|^[0-9a-f]{6}$/i.test(value)) return null;
  const full =
    value.length === 3
      ? value
          .split("")
          .map((ch) => ch + ch)
          .join("")
      : value;
  return [
    parseInt(full.slice(0, 2), 16),
    parseInt(full.slice(2, 4), 16),
    parseInt(full.slice(4, 6), 16),
  ];
}

function luminance(hex: string): number | null {
  const rgb = parseHex(hex);
  if (!rgb) return null;
  const [r, g, b] = rgb.map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrastRatio(a: string, b: string): number | null {
  const l1 = luminance(a);
  const l2 = luminance(b);
  if (l1 === null || l2 === null) return null;
  const [hi, lo] = l1 > l2 ? [l1, l2] : [l2, l1];
  return (hi + 0.05) / (lo + 0.05);
}

export function sanitizeName(raw: string): string {
  const base = raw
    .replace(/^https?:\/\//i, "")
    .replace(/[^\w.-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
  return base || "qr-code";
}

export const STORAGE_KEY = "qr-studio-config-v1";

export function loadConfig(): QrConfig {
  if (typeof window === "undefined") return DEFAULT_CONFIG;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_CONFIG;
    const parsed = JSON.parse(raw) as Partial<QrConfig>;
    return { ...DEFAULT_CONFIG, ...parsed };
  } catch {
    return DEFAULT_CONFIG;
  }
}

export function saveConfig(config: QrConfig): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch {
    /* storage may be full or unavailable */
  }
}
