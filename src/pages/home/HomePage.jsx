import { Link } from 'react-router-dom';
import { ArrowRight, Gavel, Shield, Truck, CreditCard, Zap, Clock, Users, TrendingUp, Store, Eye, Heart } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { productService, auctionService, categoryService } from '../../services/api';
import { Layout } from '../../components/layout';
import { Card, Badge, PriceFormatter, Spinner } from '../../components/ui';
import { CountdownTimer as AuctionTimer } from '../../components/ui/CountdownTimer'; // Renamed for clarity

// Helper function for formatting price, as used in the new ProductCard
const formatPrice = (price) => {
  if (price === undefined || price === null) return '';
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(price);
};

function ProductCard({ product }) {
  const isAuction = product.type === 'auction';
  const bidsCount = product.auction?.bids_count || 0;

  return (
    <Link
      to={isAuction ? `/auctions/${product.auction?.id}` : `/products/${product.slug}`}
      className="group bg-white rounded-2xl overflow-hidden border border-gray-100 hover:shadow-2xl hover:shadow-amber-900/10 transition-all duration-500 flex flex-col h-full relative"
    >
      <div className="relative aspect-square overflow-hidden bg-gray-50">
        <img
          src={product.thumbnail || 'https://via.placeholder.com/400x400?text=Kemazon'}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

        {isAuction && (
          <>
            <Badge variant="warning" className="absolute top-3 left-3 bg-amber-100 text-amber-700 border-amber-200">
              <Gavel className="w-3 h-3 mr-1" /> Subasta
            </Badge>
            {bidsCount > 10 && (
              <Badge className="absolute top-3 right-3 bg-red-600 text-white border-transparent animate-pulse shadow-lg font-bold">
                +{bidsCount}🔥
              </Badge>
            )}
          </>
        )}
      </div>

      <div className="p-6 flex flex-col flex-1">
        <div className="flex flex-col flex-1">
          <h3 className="text-sm font-semibold text-gray-900 mb-1 group-hover:text-amber-600 transition-colors line-clamp-2">
            {product.name}
          </h3>
          <div className="flex items-center gap-3 mb-3">
            <p className="text-xs text-gray-500">{product.category?.name}</p>
            <div className="flex items-center gap-3 ml-auto">
              <div className="flex items-center text-[10px] text-gray-400 font-medium">
                <Eye className="w-3 h-3 mr-1 text-gray-400" />
                {product.visits_count || 0}
              </div>
              <div className="flex items-center text-[10px] text-gray-400 font-medium">
                <Heart className="w-3 h-3 mr-1 text-gray-400" />
                {product.likes_count || 0}
              </div>
            </div>
          </div>

          <div className="mt-auto">
            {isAuction ? (
              <div className="space-y-1">
                <div className="flex flex-col">
                  {product.auction?.starting_price && (
                    <span className="text-xs text-gray-400 font-bold mb-0.5">
                      Base: {formatPrice(product.auction.starting_price)}
                    </span>
                  )}
                  <span className="text-[10px] uppercase tracking-wider text-gray-400 font-bold">Precio actual:</span>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-lg font-black text-gray-900">
                    {formatPrice(product.auction?.current_price)}
                  </span>
                </div>
                <div className="mt-2 pt-2 border-t border-gray-50">
                  <AuctionTimer endDate={product.auction?.ends_at} size="small" />
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <span className="text-xl font-black text-gray-900">
                  {formatPrice(product.price)}
                </span>
                <span className="text-[10px] uppercase tracking-wider text-gray-400 font-bold">
                  Comprar ahora
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

export function HomePage() {
  const { data: productsData, isLoading: loadingProducts } = useQuery({
    queryKey: ['products', 'featured'],
    queryFn: () => productService.getAll({ per_page: 8 }),
  });

  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoryService.getAll(),
  });

  const products = productsData?.data?.data || [];
  const categories = categoriesData?.data?.categories || [];

  return (
    <Layout>
      <section className="relative bg-gradient-to-br from-primary-50 via-white to-secondary-50 py-20 overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiMwMDAiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-50" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-5xl md:text-6xl font-bold mb-6">
              Compra, Vende y{' '}
              <span className="gradient-text">Puja</span>{' '}
              en KEMAZON
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              La plataforma de e-commerce multi-vendedor con las mejores ofertas del mercado argentino.
              Desde compras directas hasta subastas en tiempo real.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/products" className="btn-primary flex items-center">
                Explorar Tienda <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
              <Link to="/auctions" className="btn-outline flex items-center">
                <Gavel className="mr-2 w-5 h-5" /> Ver Subastas
              </Link>
            </div>
          </div>
        </div>
      </section>

      <div className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Productos Destacados</h2>
          {loadingProducts ? (
            <div className="py-12">
              <Spinner size="lg" />
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </div>

      <section className="py-16 bg-gradient-to-r from-primary-600 to-secondary-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">¿Quieres ser vendedor?</h2>
          <p className="text-xl text-white/80 mb-8 max-w-2xl mx-auto">
            Únete a KEMAZON y llega a miles de compradores en Argentina.
            Publica tus productos y participa en subastas.
          </p>
          <Link
            to="/become-seller"
            className="inline-flex items-center px-8 py-3 bg-white text-primary-600 font-semibold rounded-xl hover:bg-gray-100 transition-colors"
          >
            <Store className="mr-2 w-5 h-5" /> Convertirme en Vendedor
          </Link>
        </div>
      </section>
    </Layout>
  );
}
