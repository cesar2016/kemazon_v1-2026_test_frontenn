import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { notificationService } from '../../services/api';
import { Layout } from '../../components/layout';
import { Card, Button, Badge, Spinner } from '../../components/ui';
import { Bell, Gavel, Package, ShoppingBag, Banknote, PlusSquare, Megaphone, Info, Trash2, Shield, Calendar, Clock, ChevronLeft, ChevronRight, Trophy, Check, CreditCard } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';

const getIconBadge = (type) => {
    switch (type) {
        case 'auction_leading':
            return { icon: <span className="text-2xl">💪</span>, color: 'bg-primary-50 border-primary-100' };
        case 'outbid':
        case 'outbid_auto':
            return { icon: <span className="text-2xl">👎</span>, color: 'bg-red-50 border-red-100' };
        case 'auction_lost':
            return { icon: <span className="text-2xl">☹️</span>, color: 'bg-gray-100 border-gray-200' };
        case 'auction_won':
            return { icon: <span className="text-2xl">🏆</span>, color: 'bg-yellow-50 border-yellow-100' };
        case 'product_purchased':
            return { icon: <span className="text-2xl">🛍️</span>, color: 'bg-green-50 border-green-100' };
        case 'product_sold':
            return { icon: <span className="text-2xl">💰</span>, color: 'bg-blue-50 border-blue-100' };
        case 'new_product':
        case 'new_auction':
            return { icon: <span className="text-2xl">✨</span>, color: 'bg-indigo-50 border-indigo-100' };
        case 'admin_announcement':
            return { icon: <Megaphone className="w-5 h-5 text-purple-600" />, color: 'bg-purple-50 border-purple-100' };
        default:
            return { icon: <Bell className="w-5 h-5 text-gray-500" />, color: 'bg-gray-50 border-gray-100' };
    }
};

export default function NotificationsPage() {
    const [page, setPage] = useState(1);
    const queryClient = useQueryClient();

    const { data, isLoading } = useQuery({
        queryKey: ['notifications', 'all', page],
        queryFn: () => notificationService.getAll(page),
    });

    const markAsReadMutation = useMutation({
        mutationFn: (id) => notificationService.markAsRead(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
        },
    });

    const deleteMutation = useMutation({
        mutationFn: (id) => notificationService.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
            toast.success('Notificación eliminada');
        },
    });

    const clearAllMutation = useMutation({
        mutationFn: () => notificationService.clear(),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
            toast.success('Historial vaciado');
        },
    });

    const notifications = data?.data?.data || [];
    const meta = data?.data || {};

    return (
        <Layout>
            <div className="max-w-4xl mx-auto px-4 py-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl font-black text-gray-900 tracking-tight">Centro de Notificaciones</h1>
                        <p className="text-gray-500 font-medium mt-1">Mantente al tanto de toda tu actividad en Kemazon.</p>
                    </div>
                    {notifications.length > 0 && (
                        <Button
                            variant="outline"
                            size="sm"
                            className="text-red-600 border-red-100 hover:bg-red-50"
                            onClick={() => {
                                if (window.confirm('¿Estás seguro de que quieres vaciar todo el historial?')) {
                                    clearAllMutation.mutate();
                                }
                            }}
                            loading={clearAllMutation.isPending}
                        >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Vaciar Historial
                        </Button>
                    )}
                </div>

                <div className="space-y-4">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-gray-100 shadow-sm">
                            <Spinner size="lg" className="mb-4" />
                            <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">Cargando tu actividad...</p>
                        </div>
                    ) : notifications.length === 0 ? (
                        <Card className="p-16 text-center">
                            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6 border border-gray-100">
                                <Bell className="w-10 h-10 text-gray-300" />
                            </div>
                            <h2 className="text-xl font-black text-gray-900">No hay notificaciones aún</h2>
                            <p className="text-gray-500 mt-2 max-w-sm mx-auto">
                                Aquí aparecerán las novedades sobre tus subastas, compras y anuncios de la comunidad.
                            </p>
                        </Card>
                    ) : (
                        <>
                            <div className="space-y-3">
                                {notifications.map((notif) => {
                                    const style = getIconBadge(notif.type);
                                    return (
                                        <div
                                            key={notif.id}
                                            onClick={() => {
                                                if (!notif.is_read) markAsReadMutation.mutate(notif.id);
                                            }}
                                            className={`group relative bg-white rounded-2xl border transition-all duration-300 hover:shadow-md p-5 cursor-pointer ${!notif.is_read
                                                    ? 'border-l-4 border-l-red-600 bg-red-50 shadow-sm border-red-100'
                                                    : 'border-gray-100 opacity-50 grayscale-[0.5]'
                                                }`}
                                        >
                                            <div className="flex gap-4">
                                                <div className={`flex-shrink-0 w-12 h-12 rounded-xl border flex items-center justify-center ${style.color}`}>
                                                    {style.icon}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-start justify-between gap-4">
                                                        <div>
                                                            <h3 className={`text-base leading-tight ${!notif.is_read ? 'font-black text-gray-900' : 'font-bold text-gray-700'}`}>
                                                                {notif.title}
                                                            </h3>
                                                            <div className="flex items-center gap-3 mt-1 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                                                                <span className="flex items-center gap-1">
                                                                    <Calendar className="w-3 h-3" />
                                                                    {format(new Date(notif.created_at), 'dd MMM, yyyy', { locale: es })}
                                                                </span>
                                                                <span className="flex items-center gap-1">
                                                                    <Clock className="w-3 h-3" />
                                                                    {format(new Date(notif.created_at), 'HH:mm')}
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            {!notif.is_read && (
                                                                <button
                                                                    onClick={() => markAsReadMutation.mutate(notif.id)}
                                                                    className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                                                                    title="Marcar como leído"
                                                                >
                                                                    <Check className="w-4 h-4" />
                                                                </button>
                                                            )}
                                                            <button
                                                                onClick={() => deleteMutation.mutate(notif.id)}
                                                                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                                title="Eliminar"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                    <p className="mt-2 text-sm text-gray-600 font-medium leading-relaxed">
                                                        {notif.message}
                                                    </p>
                                                    {notif.data?.auction_id && (
                                                        <Button
                                                            variant="outline"
                                                            size="xs"
                                                            className="mt-3 font-bold"
                                                            as={Link}
                                                            to={`/auctions/${notif.data.auction_id}`}
                                                        >
                                                            Ver Subasta
                                                        </Button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {meta.last_page > 1 && (
                                <div className="flex items-center justify-center gap-2 mt-8">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        disabled={page === 1}
                                        onClick={() => setPage(page - 1)}
                                    >
                                        <ChevronLeft className="w-4 h-4 mr-1" /> Anterior
                                    </Button>
                                    <span className="text-xs font-black px-4 py-2 bg-gray-100 rounded-lg text-gray-600">
                                        PÁGINA {page} DE {meta.last_page}
                                    </span>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        disabled={page === meta.last_page}
                                        onClick={() => setPage(page + 1)}
                                    >
                                        Siguiente <ChevronRight className="w-4 h-4 ml-1" />
                                    </Button>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </Layout>
    );
}
