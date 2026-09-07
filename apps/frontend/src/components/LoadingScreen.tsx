export default function LoadingScreen({ label = 'Getting things ready' }: { label?: string }) {
  return (
    <main className="grid min-h-screen place-items-center bg-[#f3f3f2] px-6">
      <div role="status" className="flex flex-col items-center text-center">
        <div aria-hidden="true" className="relative mb-10 grid h-24 w-24 place-items-center">
          <div className="absolute h-16 w-16 rotate-[-25deg] rounded-[22px] border-[10px] border-black" />
          <div className="absolute h-16 w-16 rotate-[25deg] rounded-[22px] border-[10px] border-amber-400 motion-safe:animate-pulse" />
        </div>
        <p className="text-4xl font-black tracking-[-0.06em]">BANDIT<span className="text-amber-500">.</span></p>
        <p className="mt-3 text-sm text-neutral-500">{label}</p>
        <div aria-hidden="true" className="mt-8 h-1 w-32 overflow-hidden rounded-full bg-neutral-200">
          <div className="h-full w-1/2 rounded-full bg-amber-400 motion-safe:animate-pulse" />
        </div>
        <span className="sr-only">Loading, please wait.</span>
      </div>
    </main>
  );
}
