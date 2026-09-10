import { redirect } from 'next/navigation';

export default function WristbandCategory({ params }: { params: { category: string } }) {
  const aliases: Record<string, string> = {
    vinyl: 'vinyl-plastic',
    plastic: 'vinyl-plastic',
    silicone: 'rubber-silicone',
    rubber: 'rubber-silicone',
  };
  const category = aliases[params.category] ?? params.category;
  redirect(
    `/wristbands/${encodeURIComponent(category.endsWith('-standard') ? category : `${category}-standard`)}`
  );
}
