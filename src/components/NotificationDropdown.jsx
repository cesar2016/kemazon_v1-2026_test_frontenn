import { Bell, Gavel, Package, Info, Check, Trash2, Shield, Trophy, ShoppingBag, Banknote, PlusSquare, Megaphone } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationService } from '../services/api';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';

const getIcon = (type) => {
    switch (type) {
        case 'auction_leading':
            return <span className="text-xl">💪</span>;
        case 'outbid':
        case 'outbid_auto':
            return <span className="text-xl">👎</span>;
        case 'auction_lost':
            return <span className="text-xl">☹️</span>;
        case 'auction_won':
            return <span className="text-xl">🏆</span>;
        case 'product_purchased':
            return <span className="text-xl">🛍️</span>;
        case 'product_sold':
            return <span className="text-xl">💰</span>;
        case 'new_product':
        case 'new_auction':
            return <span className="text-xl">✨</span>;
        case 'admin_announcement':
            return <Megaphone className="w-5 h-5 text-purple-600" />;
        default:
            return <Bell className="w-5 h-5 text-gray-400" />;
    }
};

export function NotificationDropdown({ isOpen, onClose }) {
    const queryClient = useQueryClient();

    const { data, isLoading } = useQuery({
        queryKey: ['notifications', 'unread'],
        queryFn: () => notificationService.getUnread(),
        refetchInterval: 30000, // Polling cada 30 segundos
    });

    const markAsReadMutation = useMutation({
        mutationFn: (id) => notificationService.markAsRead(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications', 'unread'] });
        },
    });

    const markAllAsReadMutation = useMutation({
        mutationFn: () => notificationService.markAllAsRead(),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications', 'unread'] });
            toast.success('Todas marcas como leídas');
        },
    });

    if (!isOpen) return null;

    const notifications = data?.data?.notifications || [];
    const count = data?.data?.count || 0;

    return (
        <div className="absolute right-0 mt-3 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-gray-100 py-0 animate-fade-in overflow-hidden z-50">
            <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                <div>
                    <h3 className="text-sm font-black text-gray-900 leading-none">Notificaciones</h3>
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">
                        {count > 0 ? `${count} nuevas` : 'Sin novedades'}
                    </p>
                </div>
                {count > 0 && (
                    <button
                        onClick={() => markAllAsReadMutation.mutate()}
                        className="text-[10px] font-black uppercase tracking-wider text-primary-600 hover:text-primary-700 transition-colors"
                    >
                        Marcar todo como leído
                    </button>
                )}
            </div>

            <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                {isLoading ? (
                    <div className="p-8 text-center">
                        <div className="animate-spin w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full mx-auto mb-2" />
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Cargando...</p>
                    </div>
                ) : notifications.length === 0 ? (
                    <div className="p-12 text-center">
                        <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-gray-100">
                            <Bell className="w-6 h-6 text-gray-300" />
                        </div>
                        <p className="text-sm font-bold text-gray-500">Todo el día al día</p>
                        <p className="text-xs text-gray-400 mt-1">Te avisaremos cuando pase algo importante.</p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-50">
                        {notifications.map((notif) => (
                            <div
                                key={notif.id}
                                className={`p-4 hover:bg-gray-50 transition-colors cursor-pointer relative group border-b border-gray-50 ${!notif.is_read
                                    ? 'bg-red-50 border-l-4 border-l-red-600'
                                    : 'bg-white opacity-60'
                                    }`}
                                onClick={() => {
                                    if (!notif.is_read) markAsReadMutation.mutate(notif.id);
                                    onClose();
                                }}
                            >
                                <div className="flex gap-3">
                                    <div className="flex-shrink-0 mt-1">
                                        <div className="w-8 h-8 rounded-lg bg-white shadow-sm border border-gray-100 flex items-center justify-center">
                                            {getIcon(notif.type)}
                                        </div>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className={`text-sm leading-tight ${!notif.is_read ? 'font-black text-gray-900' : 'font-medium text-gray-600'}`}>
                                            {notif.title}
                                        </p>
                                        <p className="text-xs text-gray-500 mt-1 line-clamp-2 leading-relaxed font-medium">
                                            {notif.message}
                                        </p>
                                        <p className="text-[10px] text-gray-400 font-bold mt-2 uppercase tracking-tight">
                                            {formatDistanceToNow(new Date(notif.created_at), { addSuffix: true, locale: es })}
                                        </p>
                                    </div>
                                    {!notif.is_read && (
                                        <div className="w-2 h-2 bg-primary-500 rounded-full absolute top-5 right-4 shadow-sm shadow-primary-200" />
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="p-3 border-t border-gray-100 bg-gray-50/50 text-center">
                <Link
                    to="/notifications"
                    onClick={onClose}
                    className="text-xs font-black uppercase tracking-widest text-gray-500 hover:text-primary-600 transition-colors"
                >
                    Ver historial completo
                </Link>
            </div>
        </div>
    );
}
