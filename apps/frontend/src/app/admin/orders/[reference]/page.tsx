import OrderDetail from '@/admin/OrderDetail';
export default function Page({ params }: { params: { reference: string } }) {
  return <OrderDetail reference={params.reference} />;
}
