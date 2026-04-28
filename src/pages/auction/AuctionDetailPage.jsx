import { useState, useEffect, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Helmet } from 'react-helmet-async';
import {
  Gavel, Users, TrendingUp, Trophy, ChevronRight,
  Target, Info, ArrowLeft, Share2, Star, Zap,
  ChevronLeft, ZoomIn, Package, Shield, Truck,
  RotateCcw, CreditCard, Check, Clock, Heart,
  Eye, History, User, Sparkles, X
} from 'lucide-react';
import { auctionService, productService, getProductImageUrl, getAuctionOgUrl } from '../../services/api';
import { Layout } from '../../components/layout';
import { Card, Badge, PriceFormatter, Spinner, Button, CountdownTimer, Modal } from '../../components/ui';
import { LikersModal } from '../../components/product/LikersModal';
import { SocialShareModal } from '../../components/share/SocialShareModal';
import { useAuth } from '../../contexts/AuthContext';
import { useAuctionRealtime } from '../../hooks/useAuctionRealtime';
import { buildAuctionShareData, buildPublicShareUrl } from '../../lib/share';
import { toast } from 'sonner';

/**
 * ImageCarouselModal - Premium Fullscreen Image Viewer
 */
function ImageCarouselModal({ images, initialIndex, onClose }) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  const goToPrevious = (e) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const goToNext = (e) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  return (
    <div
      className="fixed inset-0 z-[100] bg-gray-950/95 backdrop-blur-xl flex items-center justify-center animate-fade-in"
      onClick={onClose}
    >
      <button
        onClick={onClose}
        className="absolute top-6 right-6 text-white/70 hover:text-white transition-colors z-50 bg-white/10 p-3 rounded-full hover:bg-white/20"
      >
        <X className="w-6 h-6" />
      </button>

      <button
        onClick={goToPrevious}
        className="absolute left-4 sm:left-8 text-white/70 hover:text-white p-4 bg-white/5 hover:bg-white/10 rounded-full transition-all backdrop-blur-md z-40 hidden sm:block"
      >
        <ChevronLeft className="w-8 h-8" />
      </button>

      <div className="w-full h-full flex items-center justify-center p-4 sm:p-12 cursor-default" onClick={e => e.stopPropagation()}>
        <img
          src={images[currentIndex]}
          alt=""
          className="max-w-full max-h-[85vh] object-contain drop-shadow-2xl select-none"
        />
      </div>

      <button
        onClick={goToNext}
        className="absolute right-4 sm:right-8 text-white/70 hover:text-white p-4 bg-white/5 hover:bg-white/10 rounded-full transition-all backdrop-blur-md z-40 hidden sm:block"
      >
        <ChevronRight className="w-8 h-8" />
      </button>

      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex gap-3">
        {images.map((_, index) => (
          <button
            key={index}
            onClick={(e) => { e.stopPropagation(); setCurrentIndex(index); }}
            className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${currentIndex === index ? 'bg-amber-500 w-8' : 'bg-white/30 hover:bg-white/50'
              }`}
          />
        ))}
      </div>
    </div>
  );
}

function calculateMinIncrement(currentPrice) {
  const price = Number(currentPrice);
  if (price < 20000) return Math.ceil(price * 0.10);
  if (price <= 100000) return Math.ceil(price * 0.05);
  return 10000;
}

function formatDateTime(dateString) {
  const date = new Date(dateString);
  return {
    date: date.toLocaleDateString('es-AR'),
    time: date.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }),
  };
}

export function AuctionDetailPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();

  useAuctionRealtime(slug);

  const { data, isLoading, error } = useQuery({
    queryKey: ['auction', slug],
    queryFn: () => auctionService.getById(slug),
  });

  const auction = data?.data?.auction;
  const product = auction?.product;

  const minIncrement = (() => {
    const price = Number(auction?.current_price) || 0;
    if (price < 100000) return 5000;
    if (price < 500000) return 10000;
    if (price < 1000000) return 25000;
    return 50000;
  })();
  const minBid = Number(auction?.current_price || 0) + minIncrement;

  const [bidAmount, setBidAmount] = useState(String(minBid));
  const [showAllBids, setShowAllBids] = useState(false);
  const [selectedImage, setSelectedImage] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLikersModalOpen, setIsLikersModalOpen] = useState(false);
  const [isVisitorsModalOpen, setIsVisitorsModalOpen] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [visitSessionId] = useState(() => Math.random().toString(36).substring(2, 15));
  const [bidType, setBidType] = useState('manual');

  const { data: likersData, isLoading: isLoadingLikers, refetch: refetchLikers } = useQuery({
    queryKey: ['product-likers', product?.id],
    queryFn: () => productService.getLikers(product?.id),
    enabled: !!product?.id,
  });

  const { data: visitorsData, isLoading: isLoadingVisitors, refetch: refetchVisitors } = useQuery({
    queryKey: ['product-visitors', product?.id],
    queryFn: () => productService.getVisitors(product?.id),
    enabled: !!product?.id,
  });

  useEffect(() => {
    const likers = likersData?.data?.likers || likersData?.likers || [];
    if (likers.length > 0 && user?.id) {
      const hasLiked = likers.some(liker => String(liker.id) === String(user.id));
      setIsLiked(hasLiked);
    } else if (product?.is_liked !== undefined) {
      setIsLiked(product.is_liked);
    }
  }, [likersData, user?.id, product?.is_liked]);

  useEffect(() => {
    if (auction?.current_price) {
      setBidAmount(String(minBid));
    }
  }, [auction?.current_price, minBid]);


  const images = useMemo(() => {
    if (!product) return [];
    return (product.images && product.images.length > 0 && product.images[0] !== 'test')
      ? product.images
      : (product.thumbnail ? [product.thumbnail] : []);
  }, [product]);

  const shareData = useMemo(() => {
    if (!product || !auction) return null;
    const url = product?.slug ? getAuctionOgUrl(product.slug) : '';
    const imageUrl = product?.slug ? getProductImageUrl(product.slug) : (product.thumbnail || images?.[0] || '');
    return buildAuctionShareData(product, auction, url, imageUrl);
  }, [auction, images, product]);

  const placeBidMutation = useMutation({
    mutationFn: (amount) => auctionService.placeBid(auction?.id, amount),
    onSuccess: () => {
      queryClient.invalidateQueries(['auction', slug]);
      setBidAmount('');
      toast.success('¡Oferta realizada con éxito!', {
        icon: <Zap className="w-4 h-4 text-amber-500 fill-current" />
      });
    },
    onError: (error) => {
      // Error handled by interceptor, but we can do extra here
    },
  });

  const configureAutoBidMutation = useMutation({
    mutationFn: (maxBid) => auctionService.configureAutoBid(auction?.id, maxBid),
    onSuccess: (response) => {
      queryClient.invalidateQueries(['auction', slug]);
      setBidAmount('');
      toast.success(response.data.message || '¡Auto-oferta activada!', {
        icon: <Sparkles className="w-4 h-4 text-primary-500" />
      });
    },
  });

  const toggleLikeMutation = useMutation({
    mutationFn: (productId) => productService.toggleLike(productId),
    onSuccess: (data) => {
      queryClient.invalidateQueries(['auction', slug]);
      queryClient.invalidateQueries(['product-likers', product?.id]);
      if (data?.data?.liked !== undefined) {
        setIsLiked(data.data.liked);
      } else {
        setIsLiked(prev => !prev);
      }
    },
  });

  const pingVisitMutation = useMutation({
    mutationFn: () => productService.pingVisit(product?.id, visitSessionId),
    retry: false,
    retryOnMount: false,
  });

  // Track visits on mount
  useEffect(() => {
    if (product?.id) {
      pingVisitMutation.mutate();
    }
  }, [product?.id]);

  useEffect(() => {
    if (!product?.id) return;

    console.info('[AuctionDetailPage] auction payload loaded', {
      slug,
      auctionId: auction?.id,
      productId: product.id,
      likesCount: product?.likes_count ?? 0,
      visitsCount: product?.valid_visits_count ?? 0,
      embeddedLikesCount: product?.likes?.length ?? 0,
      embeddedVisitorsCount: product?.visitors?.length ?? 0,
    });
  }, [auction?.id, product?.id, product?.likes_count, product?.valid_visits_count, product?.likes?.length, product?.visitors?.length, slug]);

  useEffect(() => {
    if (!isLikersModalOpen || !product?.id) return;
    refetchLikers().catch((error) => {
      console.error('[AuctionDetailPage] failed to fetch likers', {
        productId: product?.id,
        slug,
        message: error?.message,
        status: error?.response?.status,
        data: error?.response?.data,
      });
    });
  }, [isLikersModalOpen, product?.id, refetchLikers, slug]);

  useEffect(() => {
    if (!isVisitorsModalOpen || !product?.id) return;
    refetchVisitors().catch((error) => {
      console.error('[AuctionDetailPage] failed to fetch visitors', {
        productId: product?.id,
        slug,
        message: error?.message,
        status: error?.response?.status,
        data: error?.response?.data,
      });
    });
  }, [isVisitorsModalOpen, product?.id, refetchVisitors, slug]);

  if (isLoading) {
    return (
      <Layout>
        <div className="min-h-[70vh] flex flex-col items-center justify-center">
          <Spinner size="lg" />
          <p className="mt-4 text-gray-500 font-bold animate-pulse">Conectando con la subasta...</p>
        </div>
      </Layout>
    );
  }

  if (error || !auction) {
    return (
      <Layout>
        <div className="py-20 text-center max-w-lg mx-auto px-6">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Gavel className="w-10 h-10 text-gray-300" />
          </div>
          <h2 className="text-3xl font-black text-gray-900 mb-4 tracking-tight">Subasta no disponible</h2>
          <Button onClick={() => navigate('/auctions')} variant="primary" size="lg">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver a Subastas
          </Button>
        </div>
      </Layout>
    );
  }

  const now = new Date();
  const endsAt = new Date(auction.ends_at);
  const isAuctionEnded = endsAt < now;
  const canBid = auction.is_active && !isAuctionEnded;
  const bidCount = auction.bids?.length || 0;
  const isOwner = user?.id === product?.user_id;

  const handleBidding = () => {
    if (!isAuthenticated) {
      toast.error('Debes iniciar sesión para ofertar');
      navigate('/login');
      return;
    }
    if (isOwner) {
      toast.error('No puedes ofertar en tu propia subasta');
      return;
    }
    const amount = Number(bidAmount);
    if (isNaN(amount) || amount < minBid) {
      toast.error(`La oferta mínima es $${minBid.toLocaleString('es-AR')}`);
      return;
    }

    if (bidType === 'manual') {
      placeBidMutation.mutate(amount);
    } else {
      configureAutoBidMutation.mutate(amount);
    }
  };

  const sortedBids = [...(auction.bids || [])].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  const winner = sortedBids[0]; // The most recent bid is usually the highest in our current data structure if sorted by created_at, but let's be sure
  const highestBid = [...(auction.bids || [])].sort((a, b) => b.amount - a.amount)[0];

  return (
    <>
      <Helmet>
        <title>{product?.name} | Subasta KEMAZON.ar</title>
        <meta name="description" content={shareData?.shareSummary || product?.description?.substring(0, 160) || 'Participa en esta subasta en KEMAZON.ar - La mejor plataforma de subastas de Argentina.'} />
        <meta property="og:title" content={(product?.name || 'Subasta') + ' | KEMAZON.ar'} />
        <meta property="og:description" content={shareData?.shareSummary || product?.description?.substring(0, 160) || 'Participa en esta subasta'} />
        <meta property="og:image" content={product?.slug ? getProductImageUrl(product.slug) : (product?.thumbnail || images?.[0] || '')} />
        <meta property="og:url" content={product?.slug ? getAuctionOgUrl(product.slug) : window.location.href} />
        <meta property="og:type" content="product" />
      </Helmet>
      <Layout>
        <div className="bg-gray-50 min-h-screen">
        {/* Breadcrumb */}
        <div className="hidden sm:block border-b border-gray-100 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <nav className="flex text-sm font-medium w-full">
              <Link to="/" className="text-gray-500 hover:text-primary-600 transition-colors">Inicio</Link>
              <ChevronRight className="w-4 h-4 mx-2 text-gray-300" />
              <Link to="/auctions" className="text-gray-500 hover:text-primary-600 transition-colors">Subastas</Link>
              <ChevronRight className="w-4 h-4 mx-2 text-gray-300" />
              <span className="text-gray-900 truncate">{product?.name}</span>
            </nav>
          </div>
        </div>

        {/* Mobile Header */}
        <div className="sm:hidden sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-gray-100 px-4 py-3 flex items-center justify-between w-full">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-gray-700 hover:bg-gray-100 rounded-full transition-colors">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <span className="font-bold text-gray-900 truncate max-w-[180px]">Subasta en Vivo</span>
          <button onClick={() => setIsShareOpen(true)} className="p-2 -mr-2 text-gray-700 hover:bg-gray-100 rounded-full transition-colors">
            <Share2 className="w-6 h-6" />
          </button>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-12 w-full overflow-x-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16 items-start w-full">

            {/* Gallery Section */}
            <div className="lg:col-span-7 space-y-6 w-full">
              <div className="flex flex-col-reverse sm:flex-row gap-4 w-full">
                {/* Thumbnails */}
                {images.length > 1 && (
                  <div className="flex sm:flex-col gap-3 overflow-x-auto sm:overflow-y-auto scrollbar-hide sm:max-h-[600px] w-full sm:w-24 flex-shrink-0 pb-2 sm:pb-0">
                    {images.map((image, index) => (
                      <button
                        key={index}
                        onMouseEnter={() => setSelectedImage(index)}
                        className={`group relative aspect-square rounded-2xl overflow-hidden border-2 transition-all duration-300 flex-shrink-0 sm:w-full w-20 ${selectedImage === index
                            ? 'border-amber-500 ring-2 ring-amber-50 shadow-md'
                            : 'border-transparent bg-white hover:border-gray-200'
                          }`}
                      >
                        <img src={image} alt="" className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                      </button>
                    ))}
                  </div>
                )}

                {/* Main Image */}
                <div
                  className="flex-1 relative aspect-square sm:aspect-auto sm:h-[600px] rounded-[2rem] sm:rounded-[2.5rem] overflow-hidden bg-white border border-gray-100 shadow-2xl shadow-gray-200/50 group cursor-zoom-in p-4 sm:p-0 min-w-0"
                  onClick={() => setIsModalOpen(true)}
                >
                  <div className="absolute top-6 left-6 z-10 flex flex-col gap-2">
                    <Badge variant="warning" className="px-4 py-2 text-[10px] font-black uppercase tracking-widest bg-white/90 backdrop-blur-sm border-none shadow-sm">
                      <Gavel className="w-3.5 h-3.5 mr-1" /> Subasta Activa
                    </Badge>
                    {canBid && (
                      <Badge variant="success" className="px-4 py-2 text-[10px] font-black uppercase tracking-widest bg-white/90 backdrop-blur-sm border-none shadow-sm animate-pulse">
                        ¡VIVO!
                      </Badge>
                    )}
                  </div>

                  {/* Like Button on Image */}
                  <div className="absolute top-6 right-6 z-10 flex gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsShareOpen(true);
                      }}
                      className="p-4 rounded-3xl bg-white/80 text-gray-400 hover:text-primary-600 hover:bg-white transition-all duration-300 shadow-xl backdrop-blur-md"
                    >
                      <Share2 className="w-6 h-6 transition-transform hover:scale-125" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleLikeMutation.mutate(product?.id);
                      }}
                      className={`p-4 rounded-3xl transition-all duration-300 shadow-xl backdrop-blur-md ${
                        isLiked
                          ? 'bg-red-500 text-white hover:bg-red-600 scale-110'
                          : 'bg-white/80 text-gray-400 hover:text-red-500 hover:bg-white'
                      }`}
                    >
                      <Heart className={`w-6 h-6 transition-transform hover:scale-125 ${isLiked ? 'fill-current' : ''}`} />
                    </button>
                  </div>

                  <img
                    src={images[selectedImage]}
                    alt={product?.name}
                    className="w-full h-full object-contain transition-transform duration-700 ease-out group-hover:scale-110"
                  />

                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <div className="bg-white/90 backdrop-blur-md rounded-full p-4 shadow-2xl">
                      <ZoomIn className="w-6 h-6 text-gray-800" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Description Card */}
              <div className="bg-white rounded-[2rem] p-8 border border-gray-100 shadow-sm space-y-6">
                <div className="flex items-center gap-3">
                  <div className="w-1.5 h-8 bg-amber-500 rounded-full" />
                  <h2 className="text-2xl font-black text-gray-900 tracking-tight">Descripción del Lote</h2>
                </div>
                <div className="prose prose-lg max-w-none text-gray-600 leading-relaxed">
                  <p className="whitespace-pre-wrap font-medium">
                    {product?.description || 'No hay descripción disponible para este lote.'}
                  </p>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-8 border-t border-gray-50">
                  <div className="p-4 bg-gray-50 rounded-2xl">
                    <p className="text-xs font-bold text-gray-400 uppercase mb-1">Precio Base</p>
                    <p className="font-bold text-gray-900">${Number(auction.starting_price).toLocaleString('es-AR')}</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-2xl">
                    <p className="text-xs font-bold text-gray-400 uppercase mb-1">Categoría</p>
                    <p className="font-bold text-gray-900 truncate">{product?.category?.name || 'Inmuebles'}</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-2xl col-span-2 sm:col-span-1">
                    <p className="text-xs font-bold text-gray-400 uppercase mb-1">Garantía</p>
                    <p className="font-bold text-gray-900">Kemazon Protect</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Auction Bidding Info Section */}
            <div className="lg:col-span-5 space-y-8 h-full w-full">

              {/* Status & Title Card */}
              <div className="bg-white rounded-[2.5rem] p-8 sm:p-10 border border-gray-100 shadow-xl shadow-gray-200/50 space-y-6 w-full relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-3xl -mr-16 -mt-16" />

                <div className="space-y-4 relative z-10">
                  <div className="flex items-center gap-4">
                    <Badge variant="warning" className="px-3 py-1 font-black text-[10px] tracking-widest border-none">
                      LOTE #{auction?.id}
                    </Badge>
                    <div className="flex items-center gap-1.5 text-xs font-bold text-gray-400 uppercase tracking-wider">
                      <Users className="w-3.5 h-3.5" />
                      {bidCount} pujas
                    </div>
                    <button
                      onClick={() => { refetchVisitors(); setIsVisitorsModalOpen(true); }}
                      className="flex items-center gap-1.5 text-xs font-bold text-gray-400 uppercase tracking-wider hover:text-primary-600 transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      {product?.valid_visits_count || 0} visitas
                    </button>
                    <button
                      onClick={() => {
                        refetchLikers();
                        setIsLikersModalOpen(true);
                      }}
                      className={`flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider transition-colors ${
                        isLiked ? 'text-red-500' : 'text-gray-400 hover:text-red-500'
                      }`}
                    >
                      <Heart className={`w-3.5 h-3.5 ${isLiked ? 'fill-current' : ''}`} />
                      {product?.likes_count || 0} favoritos
                    </button>
                  </div>

                  <h1 className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight leading-[1.1] group relative">
                    <span className="relative z-10">{product?.name}</span>
                    <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent opacity-0 group-hover:opacity-100 translate-x-[-100%] group-hover:translate-x-[100%] transition-all duration-700 ease-in-out blur-sm"></span>
                  </h1>
                </div>

                {/* Timer Section */}
                <div className="py-6 border-y border-gray-50 bg-gradient-to-r from-amber-50/30 to-transparent -mx-8 px-8">
                  <p className="text-xs font-black text-amber-600 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5" /> Finaliza en:
                  </p>
                  <div className="flex justify-start">
                    {isAuctionEnded ? (
                      <Badge variant="danger" className="p-4 rounded-xl text-lg font-black w-full text-center">
                        SUBASTA CERRADA
                      </Badge>
                    ) : (
                      <CountdownTimer
                        endDate={auction.ends_at}
                        onEnd={() => queryClient.invalidateQueries(['auction', slug])}
                      />
                    )}
                  </div>
                </div>

                {/* Price & Current Info */}
                <div className="space-y-6 pt-4">
                  <div className="bg-gray-50 rounded-3xl p-6 border border-gray-100 relative group transition-all hover:bg-white hover:shadow-lg">
                    <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Precio Actual</p>
                    <div className="flex items-end gap-3">
                      <PriceFormatter price={auction.current_price} className="text-5xl font-black text-primary-600 tracking-tighter" />
                    </div>

                    {highestBid && (
                      <div className="mt-4 p-3 bg-white rounded-2xl flex items-center justify-between border border-emerald-100 shadow-sm animate-fade-in">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
                            <Trophy className="w-4 h-4 text-emerald-600" />
                          </div>
                          <div>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Líder Actual</p>
                            <p className="text-sm font-black text-gray-900">{highestBid.user?.name}</p>
                          </div>
                        </div>
                        <Badge variant="success" className="px-2 py-0.5 rounded-full text-[9px] font-black tracking-widest">
                          liderando
                        </Badge>
                      </div>
                    )}
                  </div>

                  {/* Bid Controls */}
                  {!isAuctionEnded && (
                    <div className="space-y-4">
                      <div className="flex p-1.5 bg-gray-100 rounded-2xl gap-1">
                        <button
                          onClick={() => setBidType('manual')}
                          className={`flex-1 py-3 text-xs font-black rounded-xl transition-all uppercase tracking-widest ${bidType === 'manual' ? 'bg-white shadow-md text-gray-900 scale-[1.02]' : 'text-gray-400 hover:text-gray-600'
                            }`}
                        >
                          Oferta Manual
                        </button>
                        <button
                          onClick={() => setBidType('auto')}
                          className={`flex-1 py-3 text-xs font-black rounded-xl transition-all uppercase tracking-widest flex items-center justify-center gap-2 ${bidType === 'auto' ? 'bg-white shadow-md text-amber-600 scale-[1.02]' : 'text-gray-400 hover:text-gray-600'
                            }`}
                        >
                          Smart Bid <Sparkles className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {isAuthenticated ? (
                        isOwner ? (
                          <div className="p-6 bg-blue-50 text-blue-700 rounded-[2rem] text-center font-bold text-sm border border-blue-100">
                            Ves tu propio publicación
                          </div>
                        ) : (
                          <div className="space-y-4">
                            <div className="relative group">
                              <span className="absolute left-5 top-1/2 -translate-y-1/2 text-xl font-black text-gray-400 transition-colors group-focus-within:text-red-500">$</span>
                              <input
                                type="number"
                                value={bidAmount}
                                onChange={(e) => setBidAmount(e.target.value)}
                                className="w-full pl-10 pr-6 py-5 rounded-[1.5rem] bg-gray-50 border-2 border-red-500 focus:bg-white focus:ring-4 focus:ring-red-500/10 focus:border-red-600 font-black text-2xl transition-all outline-none"
                              />
                            </div>
                            <Button
                              onClick={handleBidding}
                              size="lg"
                              className="w-full py-5 rounded-[1.25rem] text-lg font-black bg-gradient-to-r from-gray-900 to-gray-800 hover:shadow-2xl hover:shadow-gray-900/40 transform hover:-translate-y-1 transition-all"
                              loading={placeBidMutation.isPending || configureAutoBidMutation.isPending}
                            >
                              {bidType === 'manual' ? 'REALIZAR OFERTA' : 'ACTIVAR SMART BID'}
                            </Button>

                            {bidType === 'auto' && (
                              <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 animate-fade-in">
                                <p className="text-[11px] text-amber-800 font-bold uppercase tracking-tight italic flex items-start gap-2">
                                  <Info className="w-3.5 h-3.5 flex-shrink-0" />
                                  El sistema se encargará de pujar por ti lo mínimo necesario para ganar hasta alcanzar tu presupuesto máximo.
                                </p>
                              </div>
                            )}

                            <div className="flex items-center justify-between px-2">
                              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Incremento Mín: ${minIncrement.toLocaleString()}</span>
                              <span className="text-[10px] font-black text-primary-600 uppercase tracking-widest flex items-center gap-1">
                                Siguiente puja: ${minBid.toLocaleString()}
                              </span>
                            </div>
                          </div>
                        )
                      ) : (
                        <div className="p-8 bg-gray-50 rounded-[2rem] text-center border border-gray-100">
                          <p className="text-gray-500 font-bold mb-4">Inicia sesión como comprador para ofertar</p>
                          <Link to="/login">
                            <Button variant="primary" className="w-full py-4 rounded-2xl">Ingresar Ahora</Button>
                          </Link>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Bid History Card */}
              <div className="bg-white rounded-[2rem] p-8 border border-gray-100 shadow-sm transition-all hover:shadow-lg">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-black text-gray-900 tracking-tight flex items-center gap-2">
                    <History className="w-5 h-5 text-gray-400" />
                    Historial de Ofertas
                  </h3>
                  <Badge variant="secondary" className="px-2 font-black text-xs">{bidCount}</Badge>
                </div>

                {!auction.bids || auction.bids.length === 0 ? (
                  <div className="py-12 text-center text-gray-400 bg-gray-50/50 rounded-2xl border-2 border-dashed border-gray-100">
                    <Zap className="w-8 h-8 mx-auto mb-2 opacity-20" />
                    <p className="text-sm font-bold uppercase tracking-widest">Aún no hay ofertas</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {sortedBids.slice(0, 5).map((bid, index) => {
                      const isHighest = bid.id === highestBid?.id;
                      const { date, time } = formatDateTime(bid.created_at);
                      return (
                        <div
                          key={bid.id}
                          className={`flex items-center justify-between p-4 rounded-2xl transition-all border ${isHighest ? 'bg-amber-50 border-amber-200 shadow-sm' : 'bg-gray-50 border-transparent hover:bg-gray-100'
                            }`}
                        >
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center border border-gray-100 shadow-sm">
                              {isHighest ? <Trophy className="w-5 h-5 text-amber-500" /> : <User className="w-5 h-5 text-gray-400" />}
                            </div>
                            <div>
                              <p className={`text-sm font-black ${isHighest ? 'text-amber-800' : 'text-gray-900'}`}>{bid.user?.name}</p>
                              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">{time}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <PriceFormatter price={bid.amount} className={`text-lg font-black ${isHighest ? 'text-amber-700' : 'text-gray-900'}`} />
                            {isHighest && <span className="text-[9px] font-black text-amber-600 block uppercase tracking-widest -mt-1">Ganando</span>}
                          </div>
                        </div>
                      );
                    })}

                    {bidCount > 5 && (
                      <button
                        onClick={() => setShowAllBids(true)}
                        className="w-full mt-4 text-xs font-black text-primary-600 hover:text-primary-700 uppercase tracking-widest py-3 border-t border-gray-50 group"
                      >
                        Ver todas las ofertas <ChevronRight className="w-4 h-4 inline group-hover:translate-x-1 transition-transform" />
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Seller Mini Card */}
              <div className="bg-gray-100/50 rounded-[2rem] p-8 flex items-center gap-5 border border-gray-200/50">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center text-white font-black text-xl shadow-lg">
                  {auction.seller?.name?.charAt(0).toUpperCase() || 'V'}
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">Publicado por</p>
                  <p className="text-lg font-black text-gray-900 leading-tight">{auction.seller?.name || product?.user?.name}</p>
                  <p className="text-xs text-green-600 font-bold flex items-center gap-1">
                    <Shield className="w-3 h-3" /> Verificado por Kemazon
                  </p>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>

      {/* Modals & Fullscreen Images */}
      {isModalOpen && (
        <ImageCarouselModal
          images={images}
          initialIndex={selectedImage}
          onClose={() => setIsModalOpen(false)}
        />
      )}

      <Modal isOpen={showAllBids} onClose={() => setShowAllBids(false)} title={`Historial de Pujas (${bidCount})`}>
        <div className="max-h-[60vh] overflow-y-auto space-y-3 pr-2 scrollbar-hide">
          {sortedBids.map((bid, index) => {
            const isHighest = index === 0;
            const { date, time } = formatDateTime(bid.created_at);
            return (
              <div key={bid.id} className={`flex items-center justify-between p-4 rounded-2xl border ${isHighest ? 'bg-amber-50 border-amber-200' : 'bg-gray-50 border-transparent'}`}>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm">
                    {isHighest ? <Trophy className="w-5 h-5 text-amber-500" /> : <User className="w-5 h-5 text-gray-400" />}
                  </div>
                  <div>
                    <p className="font-black text-gray-900">{bid.user?.name}</p>
                    <p className="text-xs text-gray-500">{date} - {time}</p>
                  </div>
                </div>
                <div className="text-right">
                  <PriceFormatter price={bid.amount} className={`text-lg font-black ${isHighest ? 'text-amber-600' : 'text-gray-900'}`} />
                </div>
              </div>
            );
          })}
        </div>
      </Modal>

      {/* Persistent Bid Bar for Mobile */}
      {canBid && (
        <div className="sm:hidden fixed bottom-0 left-0 right-0 z-50 p-4 bg-white/95 backdrop-blur-xl border-t border-gray-100 shadow-[0_-8px_30px_rgb(0,0,0,0.08)] animate-slide-up">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Precio Actual</p>
              <PriceFormatter price={auction.current_price} className="text-2xl font-black text-gray-900 tracking-tighter" />
            </div>
            <Button
              onClick={() => {
                window.scrollTo({ top: 0, behavior: 'smooth' });
                toast('Dinos cuánto quieres ofrecer en el panel de pujas');
              }}
              className="flex-[1.5] py-4 rounded-2xl font-black bg-amber-500 hover:bg-amber-600 text-white shadow-xl shadow-amber-500/20"
            >
              <Gavel className="w-5 h-5 mr-2" />
              Pujar Ahora
            </Button>
          </div>
        </div>
      )}

      <LikersModal
        isOpen={isLikersModalOpen}
        onClose={() => setIsLikersModalOpen(false)}
likers={likersData?.data?.likers || likersData?.likers || []}
        isLoading={isLoadingLikers}
        title="A quienes les gusta este producto"
      />
      <LikersModal
        isOpen={isVisitorsModalOpen}
        onClose={() => setIsVisitorsModalOpen(false)}
        likers={visitorsData?.data?.visitors || visitorsData?.visitors || []}
        isLoading={isLoadingVisitors}
        title="Visitas del producto"
        emptyMessage="Aún no hay visitas registradas."
      />

      <SocialShareModal
        isOpen={isShareOpen}
        onClose={() => setIsShareOpen(false)}
        shareData={shareData}
      />
      </Layout>
    </>
  );
}
