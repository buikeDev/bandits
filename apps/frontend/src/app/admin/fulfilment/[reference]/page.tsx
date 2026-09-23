import FulfilmentEnquiryDetail from '@/admin/FulfilmentEnquiryDetail';

export default function Page({ params }: { params: { reference: string } }) {
  return <FulfilmentEnquiryDetail reference={params.reference} />;
}
