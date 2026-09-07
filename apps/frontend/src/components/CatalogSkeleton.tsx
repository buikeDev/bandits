function Placeholder({ className }: { className: string }) {
  return <div className={`rounded bg-neutral-200 motion-safe:animate-pulse ${className}`} />;
}

export function CatalogSkeleton({ count = 12 }: { count?: number }) {
  return (
    <div role="status">
      <span className="sr-only">Loading wristbands.</span>
      <div aria-hidden="true" className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: count }, (_, index) => (
          <div key={index} className="overflow-hidden rounded-lg border border-neutral-200 bg-white">
            <Placeholder className="aspect-[4/3] rounded-none" />
            <div className="space-y-3 p-5">
              <Placeholder className="h-3 w-1/3" />
              <Placeholder className="h-5 w-3/4" />
              <Placeholder className="h-4 w-1/2" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ProductSkeleton() {
  return (
    <div role="status" className="mt-8">
      <span className="sr-only">Loading product details.</span>
      <div aria-hidden="true" className="grid gap-10 lg:grid-cols-2">
        <Placeholder className="min-h-96 rounded-xl" />
        <div className="space-y-5">
          <Placeholder className="h-3 w-20" />
          <Placeholder className="h-10 w-3/4" />
          <Placeholder className="h-20 w-full" />
          <Placeholder className="h-8 w-1/3" />
          <Placeholder className="h-12 w-full" />
          <Placeholder className="h-12 w-full" />
          <Placeholder className="h-12 w-full" />
        </div>
      </div>
    </div>
  );
}
