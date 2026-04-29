import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Gavel, Shield, Truck, CreditCard, Zap, Clock, Users, TrendingUp, Store, Eye, Heart, ChevronLeft, ChevronRight } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { productService, auctionService, categoryService } from '../../services/api';
import { Layout } from '../../components/layout';
import { Card, Badge, PriceFormatter, Spinner, ProductImage } from '../../components/ui';
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
      to={isAuction ? `/auctions/${product.slug}` : `/products/${product.slug}`}
      className="group bg-white rounded-2xl overflow-hidden border border-gray-100 hover:shadow-2xl hover:shadow-amber-900/10 transition-all duration-500 flex flex-col h-full relative"
    >
      <div className="relative aspect-square overflow-hidden bg-gray-50">
        <ProductImage
          src={product.thumbnail}
          fallbackSrcs={[
            product.images?.[0],
          ]}
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

// Hero slides data
const heroSlides = [
  {
    image: 'https://images.unsplash.com/photo-1556742049-0cf5a9e50d6d?w=1200&h=600&fit=crop',
    title: 'Comprá desde tu casa',
    subtitle: 'Miles de productos con entrega directa. Todo lo que necesitás, a un clic de distancia.',
    cta: 'Ver Productos',
    link: '/products',
  },
  {
    image: 'https://images.unsplash.com/photo-1526367791219-8d8b1eeab40c?w=1200&h=600&fit=crop',
    title: 'Vendé sin límites',
    subtitle: 'Crea tu tienda y reachá a miles de compradores en todo el país.',
    cta: 'Ser Vendedor',
    link: '/become-seller',
  },
  {
    image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1200&h=600&fit=crop',
    title: 'Rematá tus cosas',
    subtitle: 'Subastas en tiempo real. El mejor precio lo ponés vos.',
    cta: 'Ver Subastas',
    link: '/auctions',
  },
];

function HeroSlider() {
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const prevSlide = () => setCurrentSlide((currentSlide - 1 + heroSlides.length) % heroSlides.length);
  const nextSlide = () => setCurrentSlide((currentSlide + 1) % heroSlides.length);

  return (
    <section className="relative h-[500px] md:h-[600px] overflow-hidden">
      {heroSlides.map((slide, index) => (
        <div
          key={index}
          className={`absolute inset-0 transition-opacity duration-700 ${index === currentSlide ? 'opacity-100' : 'opacity-0'}`}
        >
          <div className="absolute inset-0 bg-black/40 z-10" />
          <img
            src={slide.image}
            alt={slide.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 z-20 flex items-center justify-center">
            <div className="text-center max-w-3xl mx-auto px-4">
              <h1 className="text-4xl md:text-6xl font-black text-white mb-4 drop-shadow-lg">
                {slide.title}
              </h1>
              <p className="text-xl md:text-2xl text-white/90 mb-8 drop-shadow">
                {slide.subtitle}
              </p>
              <Link to={slide.link} className="btn-primary inline-flex items-center text-lg px-8 py-4">
                {slide.cta} <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
            </div>
          </div>
        </div>
      ))}

      {/* Navigation arrows */}
      <button
        onClick={prevSlide}
        className="absolute left-4 top-1/2 -translate-y-1/2 z-30 p-3 rounded-full bg-white/20 hover:bg-white/40 backdrop-blur-sm transition-all"
      >
        <ChevronLeft className="w-6 h-6 text-white" />
      </button>
      <button
        onClick={nextSlide}
        className="absolute right-4 top-1/2 -translate-y-1/2 z-30 p-3 rounded-full bg-white/20 hover:bg-white/40 backdrop-blur-sm transition-all"
      >
        <ChevronRight className="w-6 h-6 text-white" />
      </button>

      {/* Dots */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 flex gap-2">
        {heroSlides.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentSlide(index)}
            className={`w-3 h-3 rounded-full transition-all ${index === currentSlide ? 'bg-white scale-110' : 'bg-white/50'}`}
          />
        ))}
      </div>
    </section>
  );
}

function HomePage() {
  const { data: productsData, isLoading: loadingProducts } = useQuery({
    queryKey: ['products', 'featured'],
    queryFn: () => productService.getAll({ per_page: 8 }),
  });

  const { data: auctionsData } = useQuery({
    queryKey: ['auctions', 'home'],
    queryFn: () => auctionService.getAll({ per_page: 4 }),
  });

  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoryService.getAll(),
  });

  const products = productsData?.data?.data || [];
  const auctions = auctionsData?.data?.data || [];
  const categories = categoriesData?.data?.categories || [];

  return (
    <Layout>
      <HeroSlider />

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

      {auctions.length > 0 && (
        <div className="py-12 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-3xl font-bold text-gray-900">Últimas Subastas</h2>
              <Link to="/auctions" className="text-primary-600 hover:text-primary-700 font-medium">
                Ver todas <ArrowRight className="w-4 h-4 ml-1 inline" />
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {auctions.slice(0, 4).map((auction) => (
                <Link
                  key={auction.id}
                  to={`/auctions/${auction.product?.slug || auction.id}`}
                  className="group bg-white rounded-2xl overflow-hidden border border-gray-100 hover:shadow-2xl hover:shadow-amber-900/10 transition-all duration-500 flex flex-col h-full"
                >
                  <div className="relative aspect-square overflow-hidden bg-gray-50">
                    <ProductImage
                      src={auction.product?.thumbnail}
                      fallbackSrcs={[
                        auction.product?.images?.[0],
                      ]}
                      alt={auction.product?.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    />
                    <Badge variant="warning" className="absolute top-3 left-3 bg-amber-100 text-amber-700 border-amber-200">
                      <Gavel className="w-3 h-3 mr-1" /> Subasta
                    </Badge>
                  </div>
                  <div className="p-6">
                    <h3 className="text-sm font-semibold text-gray-900 mb-2 line-clamp-2">
                      {auction.product?.name}
                    </h3>
                    <div className="mt-auto">
                      <span className="text-xs text-gray-400 font-bold">Precio actual:</span>
                      <div className="flex items-baseline gap-1">
                        <span className="text-lg font-black text-gray-900">
                          {formatPrice(auction.current_price)}
                        </span>
                      </div>
                      <div className="mt-2 pt-2 border-t border-gray-50">
                        <AuctionTimer endDate={auction.ends_at} size="small" />
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

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

export default HomePage;
