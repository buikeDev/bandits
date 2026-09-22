import LoadingScreen from '@/components/LoadingScreen';
import { Suspense } from 'react';
import CatalogueOverview from '@/admin/CatalogueOverview';
export default function Products() {
  return (
    <Suspense fallback={<LoadingScreen embedded label="Loading catalogue..." />}>
      <CatalogueOverview />
    </Suspense>
  );
}
