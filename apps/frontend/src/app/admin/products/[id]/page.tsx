import ProductEditor from '@/admin/ProductEditor';
export default function Page({ params }: { params: { id: string } }) {
  return <ProductEditor id={params.id} />;
}
