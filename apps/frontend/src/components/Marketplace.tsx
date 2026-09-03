const products = [
  ['Brand A Cap', 'Brand A', '₦8,500'],
  ['Event Tee', 'Brand B', '₦6,000'],
  ['Insulated Bottle', 'Brand C', '₦12,000'],
  ['Canvas Tote Bag', 'Brand D', '₦4,500'],
];

export default function Marketplace() {
  return (
    <section className="bg-white pb-14">
      <div className="page-shell">
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h2 className="section-title">From brands we fulfil</h2>
            <p className="mt-2 max-w-xs text-xs leading-5 text-neutral-600">
              Discover products from businesses powered by our fulfilment network.
            </p>
          </div>
          <a href="/marketplace" className="text-link">
            Shop all products <span>→</span>
          </a>
        </div>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {products.map(([name, brand, price], index) => (
            <a
              key={name}
              href={`/marketplace/${index + 1}`}
              className="overflow-hidden rounded-md border border-neutral-200"
            >
              <div
                className="aspect-[1.25] bg-cover bg-no-repeat"
                style={{
                  backgroundImage: "url('/images/marketplace-products.png')",
                  backgroundSize: '400% 100%',
                  backgroundPosition: `${index * 33.333}% center`,
                }}
              />
              <div className="p-3 text-[11px]">
                <p className="font-bold">{name}</p>
                <div className="mt-3 flex justify-between text-neutral-600">
                  <span>{brand}</span>
                  <strong className="text-black">{price}</strong>
                </div>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
