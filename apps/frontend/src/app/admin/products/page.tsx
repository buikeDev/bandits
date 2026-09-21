import { Suspense } from 'react';
import CatalogueOverview from '@/admin/CatalogueOverview';
export default function Products() {
  return (
    <Suspense fallback={<p role="status">Loading catalogue...</p>}>
      <CatalogueOverview />
    </Suspense>
  );
}
