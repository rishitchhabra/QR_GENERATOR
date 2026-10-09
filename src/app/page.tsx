import { QrGenerator } from "@/components/qr-generator";

export default function Home() {
  return (
    <main className="min-h-dvh w-full">
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -left-40 -top-40 h-[32rem] w-[32rem] rounded-full bg-indigo-600/20 blur-[120px]" />
        <div className="absolute -right-40 top-1/3 h-[28rem] w-[28rem] rounded-full bg-sky-500/15 blur-[120px]" />
        <div className="absolute bottom-0 left-1/3 h-[24rem] w-[24rem] rounded-full bg-fuchsia-500/10 blur-[120px]" />
      </div>
      <QrGenerator />
      <footer className="pb-10 text-center text-xs text-white/30">
        Built with Next.js · Deploy anywhere, including Vercel
      </footer>
    </main>
  );
}
