import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { User, Package, Gavel, MapPin, Lock, Camera, Save, X, Check, Eye, EyeOff } from 'lucide-react';
import { Layout } from '../../components/layout';
import { Button, Card, Badge, Spinner, Modal, Input } from '../../components/ui';
import { authService, orderService, auctionService, addressService } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'sonner';

const TABS = [
  { id: 'info', label: 'Mi Perfil', icon: User },
  { id: 'orders', label: 'Mis Pedidos', icon: Package },
  { id: 'bids', label: 'Mis Pujas', icon: Gavel },
  { id: 'addresses', label: 'Direcciones', icon: MapPin },
  { id: 'security', label: 'Seguridad', icon: Lock },
];

function ProfileInfo({ user, onUpdate }) {
  const [formData, setFormData] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    document_type: user?.document_type || 'dni',
    document_number: user?.document_number || '',
    mercadopago_access_token: user?.has_mercadopago_token ? '••••••••••••' : '',
    mercadopago_public_key: user?.mercadopago_public_key || '',
  });

  useEffect(() => {
    setFormData({
      name: user?.name || '',
      phone: user?.phone || '',
      document_type: user?.document_type || 'dni',
      document_number: user?.document_number || '',
      mercadopago_access_token: user?.has_mercadopago_token ? '••••••••••••' : '',
      mercadopago_public_key: user?.mercadopago_public_key || '',
    });
  }, [user]);

  const updateMutation = useMutation({
    mutationFn: (data) => authService.updateProfile(data),
    onSuccess: (response) => {
      toast.success('Perfil actualizado correctamente');
      onUpdate(response.data.user);
    },
    onError: () => {
      toast.error('Error al actualizar el perfil');
    },
  });

  const avatarMutation = useMutation({
    mutationFn: (file) => {
      const fd = new FormData();
      fd.append('avatar', file);
      return authService.updateAvatar(fd);
    },
    onSuccess: (response) => {
      toast.success('Avatar actualizado');
      onUpdate(response.data.user);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Error al subir el avatar');
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    updateMutation.mutate(formData);
  };

  const handleAvatarClick = () => {
    document.getElementById('avatar-input').click();
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        avatarMutation.mutate(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-gray-900 border-l-4 border-primary-600 pl-3">Información Personal</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="flex items-center gap-6 mb-8 p-4 bg-gray-50 rounded-2xl border border-gray-100">
          <div className="relative group">
            <div className="w-24 h-24 bg-gradient-to-br from-primary-400 to-secondary-500 rounded-full flex items-center justify-center text-white text-3xl font-bold shadow-xl overflow-hidden">
              {user?.avatar ? (
                <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
              ) : (
                user?.name?.charAt(0).toUpperCase()
              )}
            </div>
            <input
              id="avatar-input"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarChange}
            />
            <button
              type="button"
              onClick={handleAvatarClick}
              disabled={avatarMutation.isPending}
              className="absolute bottom-0 right-0 w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center text-primary-600 hover:bg-primary-50 hover:scale-110 transition-all border border-gray-100 disabled:opacity-50"
            >
              {avatarMutation.isPending ? (
                <Spinner size="sm" />
              ) : (
                <Camera className="w-4 h-4" />
              )}
            </button>
          </div>
          <div>
            <p className="text-xl font-black text-gray-900 leading-tight">{user?.name}</p>
            <p className="text-sm text-gray-500 font-medium">{user?.email}</p>
            <Badge variant={user?.is_seller ? 'success' : 'secondary'} className="mt-2 font-bold uppercase tracking-wider text-[10px]">
              {user?.is_seller ? 'Vendedor Verificado' : 'Comprador'}
            </Badge>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-1">
            <label className="block text-xs font-black uppercase tracking-widest text-gray-400 ml-1">Nombre Completo</label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="!bg-white"
            />
          </div>
          <div className="space-y-1">
            <label className="block text-xs font-black uppercase tracking-widest text-gray-400 ml-1">Teléfono</label>
            <Input
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="!bg-white"
              placeholder="+54 11 1234-5678"
            />
          </div>
          <div className="space-y-1">
            <label className="block text-xs font-black uppercase tracking-widest text-gray-400 ml-1">Tipo de Documento</label>
            <select
              value={formData.document_type}
              onChange={(e) => setFormData({ ...formData, document_type: e.target.value })}
              className="w-full px-4 py-2 border border-gray-200 bg-white rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all font-medium text-gray-700"
            >
              <option value="dni">DNI (Documento Nacional de Identidad)</option>
              <option value="cuit">CUIT</option>
              <option value="cuil">CUIL</option>
              <option value="passport">Pasaporte</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className="block text-xs font-black uppercase tracking-widest text-gray-400 ml-1">Número de Documento</label>
            <Input
              value={formData.document_number}
              onChange={(e) => setFormData({ ...formData, document_number: e.target.value })}
              className="!bg-white"
            />
          </div>
        </div>

        <div className="pt-6 border-t border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-black text-gray-900 uppercase tracking-tight flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600 text-sm">💳</span>
              Configuración de Mercado Pago
            </h3>
            {user?.has_mercadopago_token ? (
              <Badge variant="success" className="font-bold">✓ Cobros Activados</Badge>
            ) : (
              <Badge variant="warning" className="font-bold">⚠️ Cobros Desactivados</Badge>
            )}
          </div>
          <p className="text-sm text-gray-500 mb-6 font-medium">
            <strong>Importante:</strong> Debes configurar tus credenciales para recibir pagos de tus ventas. Sin ellas, los compradores no podrán pagarte.
            Puedes encontrarlas en el <a href="https://www.mercadopago.com.ar/developers/panel/credentials" target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline font-bold">Panel de Desarrolladores</a>.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-blue-50/30 p-6 rounded-2xl border border-blue-100/50">
            <div className="space-y-1">
              <label className="block text-xs font-black uppercase tracking-widest text-gray-400 ml-1">Public Key</label>
              <Input
                value={formData.mercadopago_public_key}
                onChange={(e) => setFormData({ ...formData, mercadopago_public_key: e.target.value })}
                placeholder="APP_USR-..."
                className="!bg-white"
              />
            </div>
            <div className="space-y-1">
              <label className="block text-xs font-black uppercase tracking-widest text-gray-400 ml-1">Access Token</label>
              <Input
                type="password"
                value={formData.mercadopago_access_token}
                onChange={(e) => setFormData({ ...formData, mercadopago_access_token: e.target.value })}
                placeholder="APP_USR-..."
                className="!bg-white"
              />
            </div>
          </div>
          <div className="mt-4 flex items-start gap-2 p-3 bg-amber-50 rounded-xl border border-amber-100">
            <span className="text-amber-600 text-lg">⚠️</span>
            <p className="text-[11px] text-amber-800 font-medium">
              Asegúrate de usar tus credenciales de <strong>Producción</strong> para recibir pagos reales.
              Si estás probando, utiliza las de Prueba.
            </p>
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t border-gray-50">
          <Button type="submit" loading={updateMutation.isPending} className="px-8 shadow-lg shadow-primary-100">
            <Save className="w-4 h-4 mr-2" />
            Guardar Cambios
          </Button>
        </div>
      </form>
    </Card>
  );
}

function OrdersList() {
  const { data, isLoading } = useQuery({
    queryKey: ['orders'],
    queryFn: () => orderService.getAll(),
  });

  const orders = data?.data?.data || [];

  const getStatusBadge = (status) => {
    const variants = {
      pending: 'warning',
      processing: 'info',
      shipped: 'primary',
      delivered: 'success',
      cancelled: 'error',
    };
    const labels = {
      pending: 'Pendiente',
      processing: 'Procesando',
      shipped: 'Enviado',
      delivered: 'Entregado',
      cancelled: 'Cancelado',
    };
    return <Badge variant={variants[status] || 'secondary'}>{labels[status] || status}</Badge>;
  };

  if (isLoading) return <Spinner />;

  if (orders.length === 0) {
    return (
      <Card className="p-8 text-center">
        <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500">No tienes pedidos todavía</p>
        <Button variant="outline" className="mt-4" onClick={() => window.location.href = '/products'}>
          Explorar Productos
        </Button>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {orders.map((order) => (
        <Card key={order.id} className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="font-medium text-gray-900">Pedido #{order.id}</p>
              <p className="text-sm text-gray-500">{new Date(order.created_at).toLocaleDateString('es-AR')}</p>
            </div>
            {getStatusBadge(order.status)}
          </div>
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">{order.items?.length || 0} productos</p>
            <p className="font-semibold text-gray-900">${Number(order.total).toLocaleString('es-AR', { minimumFractionDigits: 2 })}</p>
          </div>
        </Card>
      ))}
    </div>
  );
}

function MyBids() {
  const { data, isLoading } = useQuery({
    queryKey: ['my-bids'],
    queryFn: () => auctionService.getMyBids(),
  });

  const bids = data?.data || [];

  if (isLoading) return <Spinner />;

  if (bids.length === 0) {
    return (
      <Card className="p-8 text-center">
        <Gavel className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500">No has participado en subastas</p>
        <Button variant="outline" className="mt-4" onClick={() => window.location.href = '/auctions'}>
          Ver Subastas
        </Button>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {bids.map((bid) => {
        const isWinning = bid.is_winning;
        const isEnded = new Date(bid.auction?.ends_at) < new Date();

        return (
          <Card key={bid.id} className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="font-medium text-gray-900">{bid.auction?.product?.name || 'Subasta'}</p>
                <p className="text-sm text-gray-500 mt-1">
                  Tu oferta: <span className="font-medium">${Number(bid.amount).toLocaleString('es-AR', { minimumFractionDigits: 2 })}</span>
                </p>
                {bid.is_auto_bid && (
                  <Badge variant="info" className="mt-1">Oferta Automática</Badge>
                )}
              </div>
              <div className="text-right">
                {isEnded ? (
                  isWinning ? (
                    <Badge variant="success" className="flex items-center gap-1">
                      <Check className="w-3 h-3" /> Ganador
                    </Badge>
                  ) : (
                    <Badge variant="error">Finalizada</Badge>
                  )
                ) : (
                  isWinning ? (
                    <Badge variant="success" className="flex items-center gap-1">
                      <Gavel className="w-3 h-3" /> Ganando
                    </Badge>
                  ) : (
                    <Badge variant="warning">Sobrepujado</Badge>
                  )
                )}
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}

function AddressesList() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [formData, setFormData] = useState({
    street: '',
    number: '',
    floor: '',
    apartment: '',
    city: '',
    state: '',
    postal_code: '',
    country: 'Argentina',
    is_default: false,
  });

  const { data, isLoading } = useQuery({
    queryKey: ['addresses'],
    queryFn: () => addressService.getAll(),
  });

  const createMutation = useMutation({
    mutationFn: (data) => editingAddress ? addressService.update(editingAddress.id, data) : addressService.create(data),
    onSuccess: () => {
      toast.success(editingAddress ? 'Dirección actualizada' : 'Dirección agregada');
      queryClient.invalidateQueries(['addresses']);
      setIsModalOpen(false);
      resetForm();
    },
    onError: () => toast.error('Error al guardar la dirección'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => addressService.remove(id),
    onSuccess: () => {
      toast.success('Dirección eliminada');
      queryClient.invalidateQueries(['addresses']);
    },
    onError: () => toast.error('Error al eliminar la dirección'),
  });

  const setDefaultMutation = useMutation({
    mutationFn: (id) => addressService.setDefault(id),
    onSuccess: () => {
      toast.success('Dirección predeterminada actualizada');
      queryClient.invalidateQueries(['addresses']);
    },
    onError: () => toast.error('Error al actualizar'),
  });

  const resetForm = () => {
    setEditingAddress(null);
    setFormData({
      street: '',
      number: '',
      floor: '',
      apartment: '',
      city: '',
      state: '',
      postal_code: '',
      country: 'Argentina',
      is_default: false,
    });
  };

  const openEdit = (address) => {
    setEditingAddress(address);
    setFormData({
      street: address.street,
      number: address.number,
      floor: address.floor || '',
      apartment: address.apartment || '',
      city: address.city,
      state: address.state,
      postal_code: address.postal_code,
      country: address.country || 'Argentina',
      is_default: address.is_default,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  const addresses = data?.data || [];

  if (isLoading) return <Spinner />;

  return (
    <>
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Direcciones de Envío</h2>
          <Button onClick={() => { resetForm(); setIsModalOpen(true); }}>
            Agregar Dirección
          </Button>
        </div>

        {addresses.length === 0 ? (
          <div className="text-center py-8">
            <MapPin className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No tienes direcciones guardadas</p>
          </div>
        ) : (
          <div className="space-y-3">
            {addresses.map((address) => (
              <div key={address.id} className="flex items-start justify-between p-4 bg-gray-50 rounded-xl">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-gray-900">
                      {address.street} {address.number}
                      {address.floor && `, ${address.floor}${address.apartment ? ` ${address.apartment}` : ''}`}
                    </p>
                    {address.is_default && (
                      <Badge variant="success" size="sm">Predeterminada</Badge>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    {address.city}, {address.state} {address.postal_code}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {!address.is_default && (
                    <button
                      onClick={() => setDefaultMutation.mutate(address.id)}
                      className="text-sm text-primary-600 hover:text-primary-700"
                    >
                      Hacer predeterminada
                    </button>
                  )}
                  <button onClick={() => openEdit(address)} className="p-1 text-gray-400 hover:text-gray-600">
                    Editar
                  </button>
                  <button onClick={() => deleteMutation.mutate(address.id)} className="p-1 text-red-400 hover:text-red-600">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingAddress ? 'Editar Dirección' : 'Nueva Dirección'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Calle</label>
              <Input value={formData.street} onChange={(e) => setFormData({ ...formData, street: e.target.value })} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Número</label>
              <Input value={formData.number} onChange={(e) => setFormData({ ...formData, number: e.target.value })} required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Piso</label>
              <Input value={formData.floor} onChange={(e) => setFormData({ ...formData, floor: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Depto</label>
              <Input value={formData.apartment} onChange={(e) => setFormData({ ...formData, apartment: e.target.value })} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ciudad</label>
              <Input value={formData.city} onChange={(e) => setFormData({ ...formData, city: e.target.value })} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Provincia</label>
              <Input value={formData.state} onChange={(e) => setFormData({ ...formData, state: e.target.value })} required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Código Postal</label>
              <Input value={formData.postal_code} onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">País</label>
              <Input value={formData.country} onChange={(e) => setFormData({ ...formData, country: e.target.value })} disabled />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="is_default"
              checked={formData.is_default}
              onChange={(e) => setFormData({ ...formData, is_default: e.target.checked })}
              className="w-4 h-4 text-primary-600 rounded border-gray-300"
            />
            <label htmlFor="is_default" className="text-sm text-gray-700">Dirección predeterminada</label>
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
            <Button type="submit" loading={createMutation.isPending}>Guardar</Button>
          </div>
        </form>
      </Modal>
    </>
  );
}

function SecuritySettings({ user }) {
  const [passwordData, setPasswordData] = useState({
    current_password: '',
    password: '',
    password_confirmation: '',
  });
  const [showPasswords, setShowPasswords] = useState(false);

  const changePasswordMutation = useMutation({
    mutationFn: (data) => authService.changePassword(data),
    onSuccess: () => {
      toast.success('Contraseña actualizada correctamente');
      setPasswordData({ current_password: '', password: '', password_confirmation: '' });
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Error al cambiar la contraseña');
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (passwordData.password !== passwordData.password_confirmation) {
      toast.error('Las contraseñas no coinciden');
      return;
    }
    changePasswordMutation.mutate(passwordData);
  };

  return (
    <Card className="p-6">
      <h2 className="text-lg font-semibold mb-4">Cambiar Contraseña</h2>
      <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña Actual</label>
          <div className="relative">
            <Input
              type={showPasswords ? 'text' : 'password'}
              value={passwordData.current_password}
              onChange={(e) => setPasswordData({ ...passwordData, current_password: e.target.value })}
              required
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nueva Contraseña</label>
          <Input
            type={showPasswords ? 'text' : 'password'}
            value={passwordData.password}
            onChange={(e) => setPasswordData({ ...passwordData, password: e.target.value })}
            required
            minLength={8}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Confirmar Nueva Contraseña</label>
          <Input
            type={showPasswords ? 'text' : 'password'}
            value={passwordData.password_confirmation}
            onChange={(e) => setPasswordData({ ...passwordData, password_confirmation: e.target.value })}
            required
            minLength={8}
          />
        </div>
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="show_passwords"
            checked={showPasswords}
            onChange={() => setShowPasswords(!showPasswords)}
            className="w-4 h-4 text-primary-600 rounded border-gray-300"
          />
          <label htmlFor="show_passwords" className="text-sm text-gray-700">Mostrar contraseñas</label>
        </div>
        <Button type="submit" loading={changePasswordMutation.isPending}>
          Actualizar Contraseña
        </Button>
      </form>

      <div className="mt-8 pt-6 border-t">
        <h3 className="text-lg font-semibold mb-4">Sesiones Activas</h3>
        <p className="text-sm text-gray-500">Para mayor seguridad, cerrá sesión en dispositivos que no reconozcas.</p>
        <div className="mt-4 p-4 bg-gray-50 rounded-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900">Sesión Actual</p>
              <p className="text-sm text-gray-500">Esta es tu sesión activa en este dispositivo</p>
            </div>
            <Badge variant="success">Activa</Badge>
          </div>
        </div>
      </div>
    </Card>
  );
}

export function ProfilePage() {
  const { user, updateUser } = useAuth();
  const [activeTab, setActiveTab] = useState('info');

  const renderTabContent = () => {
    switch (activeTab) {
      case 'info':
        return <ProfileInfo user={user} onUpdate={updateUser} />;
      case 'orders':
        return <OrdersList />;
      case 'bids':
        return <MyBids />;
      case 'addresses':
        return <AddressesList />;
      case 'security':
        return <SecuritySettings user={user} />;
      default:
        return null;
    }
  };

  return (
    <Layout>
      <div className="bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Mi Cuenta</h1>

          <div className="flex gap-6">
            <aside className="hidden md:block w-48">
              <nav className="space-y-1">
                {TABS.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-colors ${activeTab === tab.id
                        ? 'bg-primary-50 text-primary-700 font-medium'
                        : 'text-gray-600 hover:bg-gray-100'
                        }`}
                    >
                      <Icon className="w-5 h-5" />
                      {tab.label}
                    </button>
                  );
                })}
              </nav>
            </aside>

            <div className="flex-1">
              <div className="md:hidden mb-4">
                <select
                  value={activeTab}
                  onChange={(e) => setActiveTab(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  {TABS.map((tab) => (
                    <option key={tab.id} value={tab.id}>{tab.label}</option>
                  ))}
                </select>
              </div>

              {renderTabContent()}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
