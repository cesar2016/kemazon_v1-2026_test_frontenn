import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Layout } from '../../components/layout';
import { Card, Button, Badge, Spinner, PriceFormatter, Input, Modal } from '../../components/ui';
import { adminService } from '../../services/api';
import { toast } from 'sonner';
import { Shield, UserCheck, UserX, Search, Megaphone, Send } from 'lucide-react';

export function AdminUsersPage() {
    const [searchTerm, setSearchTerm] = useState('');
    const [isBroadcastModalOpen, setIsBroadcastModalOpen] = useState(false);
    const [broadcastData, setBroadcastData] = useState({ title: '', message: '' });
    const [confirmation, setConfirmation] = useState({ isOpen: false, type: null, user: null });
    const queryClient = useQueryClient();

    const { data: users, isLoading } = useQuery({
        queryKey: ['admin-users'],
        queryFn: adminService.getUsers,
    });

    const toggleStatusMutation = useMutation({
        mutationFn: (userId) => adminService.toggleStatus(userId),
        onSuccess: (data) => {
            toast.success(data.message);
            queryClient.invalidateQueries(['admin-users']);
            setConfirmation({ isOpen: false, type: null, user: null });
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || 'Error al cambiar estado');
        },
    });

    const updateRoleMutation = useMutation({
        mutationFn: ({ userId, roleId }) => adminService.updateRole(userId, roleId),
        onSuccess: (data) => {
            toast.success(data.message);
            queryClient.invalidateQueries(['admin-users']);
            setConfirmation({ isOpen: false, type: null, user: null });
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || 'Error al actualizar rol');
        },
    });

    const broadcastMutation = useMutation({
        mutationFn: (data) => adminService.broadcastNotification(data),
        onSuccess: () => {
            toast.success('Anuncio masivo enviado con éxito');
            setIsBroadcastModalOpen(false);
            setBroadcastData({ title: '', message: '' });
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || 'Error al enviar anuncio');
        },
    });

    const handleBroadcast = (e) => {
        e.preventDefault();
        broadcastMutation.mutate(broadcastData);
    };

    const handleConfirmAction = () => {
        if (!confirmation.user) return;

        if (confirmation.type === 'status') {
            toggleStatusMutation.mutate(confirmation.user.id);
        } else if (confirmation.type === 'role') {
            updateRoleMutation.mutate({
                userId: confirmation.user.id,
                roleId: confirmation.user.role_id === 1 ? 2 : 1
            });
        }
    };

    const filteredUsers = users?.data?.filter(user =>
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <Layout>
            <div className="max-w-7xl mx-auto px-4 py-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div className="flex flex-col md:flex-row md:items-center gap-4">
                        <Button
                            onClick={() => setIsBroadcastModalOpen(true)}
                            className="bg-primary-600 hover:bg-primary-700 text-white font-black uppercase tracking-widest text-xs"
                        >
                            <Megaphone className="w-4 h-4 mr-2" />
                            Anuncio Masivo
                        </Button>
                        <div>
                            <h1 className="text-3xl font-black text-gray-900 tracking-tight">Gestión de Usuarios</h1>
                            <p className="text-gray-500 font-medium">Administra los accesos y roles de la plataforma</p>
                        </div>
                    </div>

                    <div className="relative max-w-sm w-full">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Buscar por nombre o correo..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-100 bg-white shadow-sm focus:ring-2 focus:ring-primary-500 focus:outline-none"
                        />
                    </div>
                </div>

                <Card className="overflow-hidden border-none shadow-xl">
                    {isLoading ? (
                        <div className="p-20">
                            <Spinner size="lg" />
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-gray-50 border-b border-gray-100">
                                        <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-gray-400">Usuario</th>
                                        <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-gray-400">Rol</th>
                                        <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-gray-400">Estado</th>
                                        <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-gray-400">Registro</th>
                                        <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-gray-400 text-right">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {filteredUsers?.map((user) => (
                                        <tr key={user.id} className="hover:bg-gray-50/50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center text-gray-500 font-bold">
                                                        {user.name.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-black text-gray-900">{user.name}</p>
                                                        <p className="text-xs text-gray-500 font-medium">{user.email}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <Badge variant={user.role_id === 1 ? 'primary' : 'secondary'}>
                                                    {user.role_id === 1 ? 'Administrador' : 'Usuario'}
                                                </Badge>
                                            </td>
                                            <td className="px-6 py-4">
                                                <Badge variant={user.is_blocked ? 'danger' : 'success'}>
                                                    {user.is_blocked ? 'Bloqueado' : 'Activo'}
                                                </Badge>
                                            </td>
                                            <td className="px-6 py-4">
                                                <p className="text-xs font-bold text-gray-500">
                                                    {new Date(user.created_at).toLocaleDateString()}
                                                </p>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <Button
                                                        variant="secondary"
                                                        size="sm"
                                                        onClick={() => setConfirmation({
                                                            isOpen: true,
                                                            type: 'role',
                                                            user: user
                                                        })}
                                                        disabled={updateRoleMutation.isLoading}
                                                        title={user.role_id === 1 ? 'Quitar Admin' : 'Hacer Admin'}
                                                    >
                                                        <Shield className="w-4 h-4" />
                                                    </Button>
                                                    <Button
                                                        variant={user.is_blocked ? 'success' : 'danger'}
                                                        size="sm"
                                                        onClick={() => setConfirmation({
                                                            isOpen: true,
                                                            type: 'status',
                                                            user: user
                                                        })}
                                                        disabled={toggleStatusMutation.isLoading}
                                                        title={user.is_blocked ? 'Desbloquear' : 'Bloquear'}
                                                    >
                                                        {user.is_blocked ? <UserCheck className="w-4 h-4" /> : <UserX className="w-4 h-4" />}
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {filteredUsers?.length === 0 && (
                                <div className="p-20 text-center">
                                    <p className="text-gray-500 font-medium">No se encontraron usuarios.</p>
                                </div>
                            )}
                        </div>
                    )}
                </Card>

                <Modal
                    isOpen={isBroadcastModalOpen}
                    onClose={() => setIsBroadcastModalOpen(false)}
                    title="Enviar Anuncio Masivo"
                >
                    <form onSubmit={handleBroadcast} className="space-y-4">
                        <div className="p-4 bg-primary-50 rounded-xl border border-primary-100 mb-2">
                            <div className="flex items-center gap-3 text-primary-700">
                                <Megaphone className="w-5 h-5 flex-shrink-0" />
                                <p className="text-xs font-bold uppercase tracking-widest">Este mensaje llegará a todos los usuarios</p>
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Título del Anuncio</label>
                            <Input
                                value={broadcastData.title}
                                onChange={(e) => setBroadcastData({ ...broadcastData, title: e.target.value })}
                                placeholder="Ej: Nueva gran subasta en Kemazon"
                                required
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Mensaje</label>
                            <textarea
                                className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all font-medium text-sm min-h-[120px]"
                                value={broadcastData.message}
                                onChange={(e) => setBroadcastData({ ...broadcastData, message: e.target.value })}
                                placeholder="Escribe aquí el contenido del anuncio..."
                                required
                            />
                        </div>

                        <div className="flex justify-end gap-3 pt-4">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setIsBroadcastModalOpen(false)}
                            >
                                Cancelar
                            </Button>
                            <Button
                                type="submit"
                                loading={broadcastMutation.isPending}
                                className="bg-primary-600 hover:bg-primary-700 text-white"
                            >
                                <Send className="w-4 h-4 mr-2" />
                                Enviar Ahora
                            </Button>
                        </div>
                    </form>
                </Modal>

                <Modal
                    isOpen={confirmation.isOpen}
                    onClose={() => setConfirmation({ isOpen: false, type: null, user: null })}
                    title={confirmation.type === 'status' ? 'Confirmar cambio de estado' : 'Confirmar cambio de rol'}
                >
                    <div className="space-y-4">
                        <div className="p-4 bg-amber-50 rounded-xl border border-amber-100">
                            <p className="text-sm font-bold text-amber-800">
                                {confirmation.type === 'status'
                                    ? `¿Estás seguro de que deseas ${confirmation.user?.is_blocked ? 'desbloquear' : 'bloquear'} a ${confirmation.user?.name}?`
                                    : `¿Estás seguro de que deseas cambiar el rol de ${confirmation.user?.name} a ${confirmation.user?.role_id === 1 ? 'Usuario' : 'Administrador'}?`
                                }
                            </p>
                            <p className="text-xs text-amber-600 mt-2 font-medium">
                                Esta acción afectará el acceso del usuario a la plataforma de inmediato.
                            </p>
                        </div>

                        <div className="flex justify-end gap-3">
                            <Button
                                variant="outline"
                                onClick={() => setConfirmation({ isOpen: false, type: null, user: null })}
                            >
                                Cancelar
                            </Button>
                            <Button
                                onClick={handleConfirmAction}
                                loading={toggleStatusMutation.isPending || updateRoleMutation.isPending}
                                variant={confirmation.type === 'status' && !confirmation.user?.is_blocked ? 'danger' : 'primary'}
                            >
                                Confirmar Acción
                            </Button>
                        </div>
                    </div>
                </Modal>
            </div>
        </Layout>
    );
}
