import { Link, useNavigate } from 'react-router-dom';
import { Package, ShoppingBag, Gavel, TrendingUp, Plus, DollarSign, Users, Clock, AlertCircle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { dashboardService, productService, auctionService, orderService } from '../../services/api';
import { Layout } from '../../components/layout';
import { Card, Badge, PriceFormatter, Spinner, Button, ProductImage } from '../../components/ui';
import { useAuth } from '../../contexts/AuthContext';

function StatCard({ icon: Icon, title, value, color, trend }) {
  return (
    <Card className="p-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500 mb-1">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {trend && (
            <p className={`text-sm mt-1 ${trend > 0 ? 'text-green-600' : 'text-red-600'}`}>
              {trend > 0 ? '+' : ''}{trend}% vs mes anterior
            </p>
          )}
        </div>
        <div className={`p-3 rounded-xl ${color}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </Card>
  );
}

function RecentOrderCard({ order }) {
  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-700',
    processing: 'bg-blue-100 text-blue-700',
    shipped: 'bg-purple-100 text-purple-700',
    delivered: 'bg-green-100 text-green-700',
    cancelled: 'bg-red-100 text-red-700',
  };

  return (
    <div className="flex items-center justify-between p-4 border-b border-gray-100 last:border-0">
      <div>
        <p className="font-medium text-gray-900">{order.order_number}</p>
        <p className="text-sm text-gray-500">{order.user?.name || 'Cliente'}</p>
      </div>
      <div className="text-right">
        <PriceFormatter price={order.total} />
        <Badge className={`mt-1 ${statusColors[order.status]}`}>
          {order.status}
        </Badge>
      </div>
    </div>
  );
}

function ProductCard({ product }) {
  return (
    <div className="flex items-center space-x-4 p-3 bg-gray-50 rounded-xl">
      <ProductImage
        src={product.thumbnail}
        fallbackSrcs={[product.images?.[0]]}
        alt={product.name}
        className="w-16 h-16 object-cover rounded-lg"
      />
      <div className="flex-1 min-w-0">
        <p className="font-medium text-gray-900 truncate">{product.name}</p>
        <p className="text-sm text-gray-500">{product.category?.name || 'Sin categoría'}</p>
      </div>
      <div className="text-right">
        <PriceFormatter price={product.price} />
        <Badge variant={product.is_active ? 'success' : 'danger'} className="mt-1">
          {product.is_active ? 'Activo' : 'Inactivo'}
        </Badge>
      </div>
    </div>
  );
}

export function SellerDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data: stats, isLoading: loadingStats } = useQuery({
    queryKey: ['seller-stats'],
    queryFn: () => dashboardService.getStats(),
    enabled: !!user?.is_seller,
  });

  const { data: activity } = useQuery({
    queryKey: ['seller-activity'],
    queryFn: () => dashboardService.getActivity(),
    enabled: !!user?.is_seller,
  });

  const { data: productsData } = useQuery({
    queryKey: ['my-products'],
    queryFn: () => productService.getMyProducts({ per_page: 5 }),
    enabled: !!user?.is_seller,
  });

  const { data: ordersData } = useQuery({
    queryKey: ['seller-orders'],
    queryFn: () => orderService.getSellerOrders({ per_page: 5 }),
    enabled: !!user?.is_seller,
  });

  const statsData = stats?.data?.stats || {};
  const products = productsData?.data?.data || [];
  const orders = ordersData?.data?.data || [];

  if (!user?.is_seller) {
    return (
      <Layout>
        <div className="max-w-2xl mx-auto py-16 text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <ShoppingBag className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Conviértete en Vendedor</h1>
          <p className="text-gray-600 mb-8">
            Llega a miles de compradores en Argentina. Publica tus productos y participa en subastas.
          </p>
          <Button onClick={() => navigate('/become-seller')} className="btn-primary">
            <Plus className="w-5 h-5 mr-2" /> Activar Cuenta de Vendedor
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Panel de Vendedor</h1>
              <p className="text-gray-500">Bienvenido, {user?.name}</p>
            </div>
            <div className="flex space-x-3">
              <Link to="/seller/products/create">
                <Button>
                  <Plus className="w-5 h-5 mr-2" /> Nuevo Producto
                </Button>
              </Link>
              <Link to="/seller/auctions/create">
                <Button variant="outline">
                  <Gavel className="w-5 h-5 mr-2" /> Nueva Subasta
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loadingStats ? (
          <Spinner size="lg" />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatCard
              icon={Package}
              title="Productos"
              value={statsData.products?.total || 0}
              color="bg-gradient-to-br from-primary-500 to-secondary-500"
            />
            <StatCard
              icon={Gavel}
              title="Subastas Activas"
              value={statsData.auctions?.active || 0}
              color="bg-gradient-to-br from-orange-500 to-red-500"
            />
            <StatCard
              icon={ShoppingBag}
              title="Pedidos Pendientes"
              value={statsData.sales?.pending_orders || 0}
              color="bg-gradient-to-br from-blue-500 to-purple-500"
            />
            <StatCard
              icon={DollarSign}
              title="Ingresos Totales"
              value={
                <PriceFormatter
                  price={statsData.sales?.total_revenue || 0}
                  className="text-2xl"
                />
              }
              color="bg-gradient-to-br from-green-500 to-emerald-500"
            />
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <Card className="mb-6">
              <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Productos Recientes</h2>
                <Link to="/seller/products" className="text-primary-600 hover:text-primary-700 text-sm font-medium">
                  Ver todos
                </Link>
              </div>
              <div className="p-4">
                {products.length === 0 ? (
                  <div className="text-center py-8">
                    <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500 mb-4">No tienes productos aún</p>
                    <Link to="/seller/products/create">
                      <Button size="sm">
                        <Plus className="w-4 h-4 mr-2" /> Crear Producto
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {products.map((product) => (
                      <ProductCard key={product.id} product={product} />
                    ))}
                  </div>
                )}
              </div>
            </Card>

            <Card>
              <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Últimos Pedidos</h2>
                <Link to="/seller/orders" className="text-primary-600 hover:text-primary-700 text-sm font-medium">
                  Ver todos
                </Link>
              </div>
              <div>
                {orders.length === 0 ? (
                  <div className="p-6 text-center">
                    <ShoppingBag className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">No tienes pedidos aún</p>
                  </div>
                ) : (
                  orders.map((order) => (
                    <RecentOrderCard key={order.id} order={order} />
                  ))
                )}
              </div>
            </Card>
          </div>

          <div>
            <Card className="mb-6">
              <div className="p-6 border-b border-gray-100">
                <h2 className="text-lg font-semibold text-gray-900">Acciones Rápidas</h2>
              </div>
              <div className="p-4 space-y-3">
                <Link to="/seller/products/create" className="block">
                  <Button variant="secondary" className="w-full justify-start">
                    <Plus className="w-5 h-5 mr-3" /> Crear Producto
                  </Button>
                </Link>
                <Link to="/seller/auctions/create" className="block">
                  <Button variant="secondary" className="w-full justify-start">
                    <Gavel className="w-5 h-5 mr-3" /> Crear Subasta
                  </Button>
                </Link>
                <Link to="/seller/products" className="block">
                  <Button variant="secondary" className="w-full justify-start">
                    <Package className="w-5 h-5 mr-3" /> Gestionar Productos
                  </Button>
                </Link>
                <Link to="/seller/orders" className="block">
                  <Button variant="secondary" className="w-full justify-start">
                    <ShoppingBag className="w-5 h-5 mr-3" /> Ver Pedidos
                  </Button>
                </Link>
              </div>
            </Card>

            <Card>
              <div className="p-6 border-b border-gray-100">
                <h2 className="text-lg font-semibold text-gray-900">Estadísticas</h2>
              </div>
              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Subastas terminadas</span>
                  <span className="font-semibold text-gray-900">{statsData.auctions?.ended || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Ventas totales</span>
                  <span className="font-semibold text-gray-900">{statsData.sales?.total_orders || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Ingresos</span>
                  <span className="font-semibold text-green-600">
                    ${(statsData.sales?.total_revenue || 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
}
