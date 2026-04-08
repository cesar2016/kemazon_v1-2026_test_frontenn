import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Gavel, Users, TrendingUp, Trophy, ChevronRight } from 'lucide-react';
import { auctionService } from '../../services/api';
import { Layout } from '../../components/layout';
import { Card, Badge, PriceFormatter, Spinner, Button, CountdownTimer, Modal } from '../../components/ui';
import { useAuth } from '../../contexts/AuthContext';
import { useAuctionRealtime } from '../../hooks/useAuctionRealtime';
import { toast } from 'sonner';

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
  const { id } = useParams();
  const { user, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const [bidAmount, setBidAmount] = useState('');
  const [showAllBids, setShowAllBids] = useState(false);

  useAuctionRealtime(id);

  const { data, isLoading, error } = useQuery({
    queryKey: ['auction', id],
    queryFn: () => auctionService.getById(id),
  });

  const placeBidMutation = useMutation({
    mutationFn: (amount) => auctionService.placeBid(id, amount),
    onSuccess: () => {
      queryClient.invalidateQueries(['auction', id]);
      setBidAmount('');
      toast.success('¡Oferta realizada con éxito!');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Error al realizar la oferta');
    },
  });

  const [bidType, setBidType] = useState('manual'); // 'manual' or 'auto'

  const configureAutoBidMutation = useMutation({
    mutationFn: (maxBid) => auctionService.configureAutoBid(id, maxBid),
    onSuccess: (response) => {
      queryClient.invalidateQueries(['auction', id]);
      setBidAmount('');
      toast.success(response.data.message || '¡Auto-oferta activada!');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Error al configurar la auto-oferta');
    },
  });

  if (isLoading) {
    return (
      <Layout>
        <div className="py-12"><Spinner size="lg" /></div>
      </Layout>
    );
  }

  if (error || !data?.data?.auction) {
    return (
      <Layout>
        <div className="py-12 text-center">
          <h2 className="text-xl font-semibold text-gray-900">Subasta no encontrada</h2>
          <Link to="/auctions" className="text-primary-600 hover:underline mt-4 inline-block">
            Volver a subastas
          </Link>
        </div>
      </Layout>
    );
  }

  const auction = data.data.auction;
  const product = auction.product;
  const mainImage = product?.thumbnail || product?.images?.[0];
  const now = new Date();
  const endsAt = new Date(auction.ends_at);
  const isAuctionEnded = endsAt < now;
  const canBid = auction.is_active && !isAuctionEnded;
  const bidCount = auction.bids?.length || 0;
  const minIncrement = calculateMinIncrement(auction.current_price);
  const minBid = Number(auction.current_price) + minIncrement;
  const isOwner = user?.id === product?.user_id;


  const handleBidding = () => {
    if (!isAuthenticated) {
      toast.error('Debes iniciar sesión para ofertar');
      return;
    }
    if (isOwner) {
      toast.error('No puedes ofertar en tu propia subasta');
      return;
    }
    const amount = Number(bidAmount);
    if (isNaN(amount) || amount < minBid) {
      toast.error(`El monto mínimo es $${minBid.toLocaleString('es-AR', { minimumFractionDigits: 0 })}`);
      return;
    }

    if (bidType === 'manual') {
      placeBidMutation.mutate(amount);
    } else {
      configureAutoBidMutation.mutate(amount);
    }
  };

  const sortedByAmount = [...(auction.bids || [])].sort((a, b) => b.amount - a.amount);
  const winner = sortedByAmount[0];

  return (
    <Layout>
      <div className="bg-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex items-center space-x-2 text-sm text-gray-500 mb-6">
            <Link to="/" className="hover:text-primary-600">Inicio</Link>
            <span>/</span>
            <Link to="/auctions" className="hover:text-primary-600">Subastas</Link>
            <span>/</span>
            <span className="text-gray-900">{product?.name}</span>
          </nav>

          <div className="grid lg:grid-cols-2 gap-8">
            <div>
              {mainImage ? (
                <div className="aspect-square rounded-2xl overflow-hidden bg-gray-100 shadow-sm border border-gray-100">
                  <img src={mainImage} alt={product?.name} className="w-full h-full object-cover" />
                </div>
              ) : (
                <div className="aspect-square rounded-2xl bg-gray-100 flex items-center justify-center">
                  <Gavel className="w-20 h-20 text-gray-300" />
                </div>
              )}
            </div>

            <div className="space-y-6">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="warning">
                    <Gavel className="w-4 h-4 mr-1" /> Subasta
                  </Badge>
                  {auction.is_active && !isAuctionEnded && (
                    <Badge variant="success" className="animate-pulse">
                      ¡En Vivo!
                    </Badge>
                  )}
                </div>
                <h1 className="text-3xl font-bold text-gray-900">{product?.name}</h1>
                <p className="text-gray-500 mt-2">Vendedor: {product?.user?.name}</p>
              </div>

              <Card variant="glass" className="p-8 border-primary-100/50">
                <div className="text-center mb-6">
                  <p className="text-xs font-black uppercase tracking-widest text-gray-400 mb-2">Precio Actual</p>
                  <PriceFormatter price={auction.current_price} className="text-5xl font-black text-primary-600 tracking-tighter" />
                  {winner && (
                    <div className="mt-4 flex items-center justify-center gap-2 bg-secondary-100/50 py-1.5 px-4 rounded-full w-fit mx-auto border border-secondary-200">
                      <Trophy className="w-4 h-4 text-secondary-600" />
                      <span className="text-sm font-black text-secondary-800 uppercase tracking-tight">Líder: {winner.user?.name}</span>
                    </div>
                  )}
                </div>

                <div className="flex justify-center mb-6">
                  {isAuctionEnded ? (
                    <div className="bg-gray-100 border border-gray-200 rounded-2xl px-8 py-4 shadow-inner">
                      <span className="text-red-600 font-black uppercase tracking-widest text-sm">Subasta Finalizada</span>
                    </div>
                  ) : (
                    <CountdownTimer
                      endDate={auction.ends_at}
                      onEnd={() => queryClient.invalidateQueries(['auction', id])}
                    />
                  )}
                </div>

                <div className="flex items-center justify-center gap-8 text-xs font-bold uppercase tracking-widest text-gray-500">
                  <span className="flex items-center gap-2 bg-white/50 px-3 py-1.5 rounded-lg border border-white/50">
                    <Users className="w-4 h-4 text-tertiary-500" /> {bidCount} pujas
                  </span>
                  <span className="flex items-center gap-2 bg-white/50 px-3 py-1.5 rounded-lg border border-white/50">
                    Base: ${Number(auction.starting_price).toLocaleString('es-AR', { minimumFractionDigits: 0 })}
                  </span>
                </div>
              </Card>

              <Card className="p-1 border-0 bg-transparent shadow-none">
                <div className="flex items-center justify-between mb-4 px-2">
                  <h3 className="font-black text-gray-900 uppercase tracking-tighter text-lg italic">¡Haz tu jugada!</h3>
                  <div className="flex bg-gray-200/50 backdrop-blur-sm p-1 rounded-xl border border-white/50">
                    <button
                      onClick={() => setBidType('manual')}
                      className={`px-4 py-2 text-xs font-black rounded-lg transition-all uppercase tracking-widest ${bidType === 'manual'
                        ? 'bg-white text-primary-600 shadow-glass-sm'
                        : 'text-gray-500 hover:text-gray-700'
                        }`}
                    >
                      Manual
                    </button>
                    <button
                      onClick={() => setBidType('auto')}
                      className={`px-4 py-2 text-xs font-black rounded-lg transition-all uppercase tracking-widest ${bidType === 'auto'
                        ? 'bg-white text-primary-600 shadow-glass-sm'
                        : 'text-gray-500 hover:text-gray-700'
                        }`}
                    >
                      Auto 🚀
                    </button>
                  </div>
                </div>

                {!isAuthenticated ? (
                  <div className="glass-card p-8 text-center">
                    <p className="text-gray-600 font-bold mb-4">Inicia sesión para ganar este producto</p>
                    <Link to="/login">
                      <Button variant="primary" className="w-full">Iniciar Sesión</Button>
                    </Link>
                  </div>
                ) : isOwner ? (
                  <div className="glass p-6 text-center rounded-2xl">
                    <p className="text-gray-500 font-black italic uppercase tracking-widest text-xs">Es tu propio producto</p>
                  </div>
                ) : !canBid ? (
                  <div className="glass p-6 text-center rounded-2xl border-red-100">
                    <p className="text-red-500 font-black uppercase tracking-widest text-xs">Subasta terminada</p>
                  </div>
                ) : (
                  <div className="glass-card p-6 border-white/60">
                    <div className="space-y-4">
                      <div className="flex gap-3">
                        <div className="relative flex-1 group">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-primary-400 font-black transition-colors group-focus-within:text-primary-600">$</span>
                          <input
                            type="number"
                            value={bidAmount}
                            onChange={(e) => setBidAmount(e.target.value)}
                            placeholder={bidType === 'manual' ? `Mínimo ${minBid.toLocaleString()}` : 'Monto Máximo'}
                            className="w-full pl-8 pr-4 py-4 border border-gray-100 bg-white/50 rounded-2xl focus:bg-white focus:outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 font-black text-xl transition-all"
                          />
                        </div>
                        <Button
                          onClick={handleBidding}
                          loading={placeBidMutation.isPending || configureAutoBidMutation.isPending}
                          className="px-8 shadow-2xl"
                        >
                          {bidType === 'manual' ? 'PUJAR YA' : 'ACTIVAR'}
                        </Button>
                      </div>

                      {bidType === 'auto' && (
                        <div className="bg-tertiary-50/50 p-4 rounded-2xl border border-tertiary-100 backdrop-blur-sm animate-fade-in">
                          <p className="text-[11px] text-tertiary-800 leading-relaxed font-bold uppercase tracking-wide">
                            <span className="text-tertiary-600 mr-2">🚀 Smart Bid:</span> Ingresa tu presupuesto máximo. Nosotros pujamos lo justo para mantenerte líder.
                          </p>
                        </div>
                      )}

                      <div className="flex items-center justify-between px-2">
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Incr. Mín: ${minIncrement.toLocaleString()}</span>
                        {bidType === 'manual' && (
                          <span className="text-[10px] font-black text-primary-600 uppercase tracking-widest animate-pulse">¡Siguiente: ${minBid.toLocaleString()}!</span>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </Card>

              <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-900">Historial de Pujas</h3>
                  <Badge variant="secondary">{bidCount}</Badge>
                </div>

                {!auction.bids || auction.bids.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <p>No hay ofertas aún</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {[...(auction.bids || [])]
                      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
                      .slice(0, 10)
                      .map((bid, index) => {
                        const isWinner = index === 0;
                        const { date, time } = formatDateTime(bid.created_at);
                        return (
                          <div
                            key={bid.id}
                            className={`flex items-center justify-between py-3 px-3 rounded-xl ${isWinner ? 'bg-amber-50 border border-amber-200' : 'bg-gray-50'
                              }`}
                          >
                            <div className="flex items-center gap-3">
                              {isWinner && (
                                <div className="w-8 h-8 bg-amber-500 rounded-full flex items-center justify-center">
                                  <Trophy className="w-4 h-4 text-white" />
                                </div>
                              )}
                              {!isWinner && (
                                <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                                  <span className="text-gray-600 font-medium text-sm">
                                    {bid.user?.name?.charAt(0).toUpperCase() || '?'}
                                  </span>
                                </div>
                              )}
                              <div>
                                <div className="flex items-center gap-2">
                                  <p className={`font-medium ${isWinner ? 'text-amber-700' : 'text-gray-900'}`}>
                                    {bid.user?.name || 'Usuario'}
                                  </p>
                                  {isWinner && (
                                    <span className="bg-amber-500 text-white text-xs px-2 py-0.5 rounded-full">Ganador</span>
                                  )}
                                </div>
                                <p className="text-xs text-gray-500">{date} - {time}</p>
                              </div>
                            </div>
                            <PriceFormatter price={bid.amount} className={isWinner ? 'text-amber-700 font-bold' : ''} />
                          </div>
                        );
                      })}
                    {(auction.bids || []).length > 10 && (
                      <button
                        onClick={() => setShowAllBids(true)}
                        className="w-full py-3 text-center text-primary-600 hover:text-primary-700 font-medium"
                      >
                        Ver todas las {(auction.bids || []).length} ofertas <ChevronRight className="w-4 h-4 inline" />
                      </button>
                    )}
                  </div>
                )}
              </Card>
            </div>
          </div>
        </div>
      </div>

      <Modal isOpen={showAllBids} onClose={() => setShowAllBids(false)} title={`Todas las Ofertas (${(auction.bids || []).length})`}>
        <div className="max-h-96 overflow-y-auto space-y-2">
          {[...(auction.bids || [])]
            .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
            .map((bid, index) => {
              const isWinner = index === 0;
              const { date, time } = formatDateTime(bid.created_at);
              return (
                <div
                  key={bid.id}
                  className={`flex items-center justify-between py-3 px-4 rounded-xl ${isWinner ? 'bg-amber-50 border border-amber-200' : 'bg-gray-50'
                    }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isWinner ? 'bg-amber-500' : 'bg-gray-200'}`}>
                      {isWinner ? <Trophy className="w-5 h-5 text-white" /> : <span className="text-gray-600 font-medium">{bid.user?.name?.charAt(0).toUpperCase()}</span>}
                    </div>
                    <div>
                      <p className={`font-medium ${isWinner ? 'text-amber-700' : 'text-gray-900'}`}>{bid.user?.name || 'Usuario'}</p>
                      <p className="text-xs text-gray-500">{date} - {time}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <PriceFormatter price={bid.amount} className={isWinner ? 'text-amber-700 font-bold text-lg' : ''} />
                    {isWinner && <span className="text-xs text-amber-600 font-medium block">Ganador</span>}
                  </div>
                </div>
              );
            })}
        </div>
      </Modal>
    </Layout>
  );
}
