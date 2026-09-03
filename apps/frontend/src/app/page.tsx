import Header from '@/components/Header';
import Hero from '@/components/Hero';
import WristbandsShop from '@/components/WristbandsShop';
import CustomPrinting from '@/components/CustomPrinting';
import Marketplace from '@/components/Marketplace';
import Fulfillment from '@/components/Fulfillment';
import BulkOrders from '@/components/BulkOrders';
import Footer from '@/components/Footer';

export default function Home() {
  return (
    <main>
      <Header />
      <Hero />
      <WristbandsShop />
      <CustomPrinting />
      <Marketplace />
      <Fulfillment />
      <BulkOrders />
      <Footer />
    </main>
  );
}
