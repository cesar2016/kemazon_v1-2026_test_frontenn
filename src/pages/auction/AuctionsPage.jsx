import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Gavel, Clock, Users, TrendingUp, Filter } from 'lucide-react';
import { auctionService } from '../../services/api';
import { Layout } from '../../components/layout';
import { Card, Badge, PriceFormatter, Spinner, Button, CountdownTimer } from '../../components/ui';
import { useAuctionRealtime } from '../../hooks/useAuctionRealtime';

function AuctionCard({ auction }) {
  const mainImage = auction.product?.thumbnail;
  const bidCount = auction.bids?.length || 0;
  const [currentPrice, setCurrentPrice] = useState(auction.current_price);

  return (
    <Link to={`/auctions/${auction.id}`} className="block">
      <Card hover className="h-full relative overflow-hidden">
        <div className="absolute top-3 right-3 z-10">
          <Badge variant={bidCount > 0 ? 'success' : 'secondary'}>
            <Users className="w-3 h-3 mr-1" /> {bidCount} pujas
          </Badge>
        </div>
        
        <div className="relative aspect-video overflow-hidden bg-gray-100">
          {mainImage ? (
            <img
              src={mainImage}
              alt={auction.product?.name}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <svg className="w-16 h-16 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-4">
            <div className="flex justify-center">
              <CountdownTimer endDate={auction.ends_at} size="small" />
            </div>
          </div>
        </div>

        <div className="p-4">
          <h3 className="font-medium text-gray-900 line-clamp-2 mb-3">{auction.product?.name}</h3>
          
          <div className="space-y-2 mb-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">Precio Actual:</span>
              <PriceFormatter price={currentPrice} className="text-lg" />
            </div>
            {auction.starting_price && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">Precio Base:</span>
                <PriceFormatter price={auction.starting_price} className="text-sm text-gray-400" />
              </div>
            )}
          </div>

          <div className="flex items-center justify-between bg-amber-50 p-3 rounded-xl">
            <span className="text-sm font-medium text-amber-800">
              {auction.reserve_met ? 'Reserva alcanzada' : 'Sin reserva mínima'}
            </span>
            <TrendingUp className="w-5 h-5 text-amber-600" />
          </div>

          <Button className="w-full mt-4" variant="outline">
            <Gavel className="w-4 h-4 mr-2" /> Pujar Ahora
          </Button>
        </div>
      </Card>
    </Link>
  );
}

export function AuctionsPage() {
  const [filter, setFilter] = useState('active');
  useAuctionRealtime();

  const { data, isLoading } = useQuery({
    queryKey: ['auctions', filter],
    queryFn: () => auctionService.getAll({ filter, per_page: 20 }),
  });

  const auctions = data?.data?.data || [];

  return (
    <Layout>
      <div className="bg-gradient-to-br from-amber-50 to-orange-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="inline-flex items-center space-x-2 bg-amber-100 text-amber-800 px-4 py-2 rounded-full mb-4">
              <Gavel className="w-5 h-5" />
              <span className="font-medium">Remates en Vivo</span>
            </div>
<h1 className="text-4xl font-bold text-gray-900 mb-4">
               ¡Remates Exclusivos!
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Participa en subastas emocionantes. Cada puja es una oportunidad de conseguir 
              productos increíbles a precios únicos.
            </p>
          </div>

          <div className="flex items-center justify-center space-x-4 mb-8">
            <Button 
              variant={filter === 'active' ? 'primary' : 'outline'}
              onClick={() => setFilter('active')}
            >
              Activas
            </Button>
            <Button 
              variant={filter === 'ending' ? 'primary' : 'outline'}
              onClick={() => setFilter('ending')}
            >
              Finalizando Pronto
            </Button>
            <Button 
              variant={filter === 'new' ? 'primary' : 'outline'}
              onClick={() => setFilter('new')}
            >
              Nuevas
            </Button>
          </div>
        </div>
      </div>

      <div className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {isLoading ? (
            <Spinner size="lg" />
          ) : auctions.length === 0 ? (
            <div className="text-center py-12">
              <Gavel className="w-16 h-16 mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No hay remates activos</h3>
              <p className="text-gray-500">Vuelve pronto para nuevos remates</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {auctions.map((auction) => (
                <AuctionCard key={auction.id} auction={auction} />
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="py-12 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">¿Cómo funcionan las subastas?</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: '1',
                title: 'Explora las subastas',
                description: 'Navega por las subastas activas y encuentra productos que te interesen.',
              },
              {
                step: '2',
                title: 'Realiza tu puja',
                description: 'Ingresa el monto que estás dispuesto a pagar. ¡La puja más alta gana!',
              },
              {
                step: '3',
                title: 'Gana y paga',
                description: 'Si ganas, recibe el producto con el precio que tú definiste.',
              },
            ].map((item) => (
              <div key={item.step} className="bg-white rounded-2xl p-6 shadow-sm">
                <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl flex items-center justify-center text-white font-bold text-xl mb-4">
                  {item.step}
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-gray-500">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
}
