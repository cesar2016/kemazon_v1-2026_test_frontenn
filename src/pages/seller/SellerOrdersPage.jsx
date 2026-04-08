import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ShoppingBag, Clock, CheckCircle, Truck, XCircle } from 'lucide-react';
import { orderService } from '../../services/api';
import { Layout } from '../../components/layout';
import { Button, Card, Badge, PriceFormatter, Spinner } from '../../components/ui';
import { toast } from 'sonner';

const statusConfig = {
  pending: { label: 'Pendiente', color: 'bg-yellow-100 text-yellow-700', icon: Clock },
  processing: { label: 'Procesando', color: 'bg-blue-100 text-blue-700', icon: ShoppingBag },
  shipped: { label: 'Enviado', color: 'bg-purple-100 text-purple-700', icon: Truck },
  delivered: { label: 'Entregado', color: 'bg-green-100 text-green-700', icon: CheckCircle },
  cancelled: { label: 'Cancelado', color: 'bg-red-100 text-red-700', icon: XCircle },
};

function OrderCard({ order }) {
  const queryClient = useQueryClient();
  const config = statusConfig[order.status] || statusConfig.pending;
  const StatusIcon = config.icon;

  const updateStatus = useMutation({
    mutationFn: (status) => orderService.updateStatus(order.id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries(['seller-orders']);
      toast.success('Estado actualizado');
    },
    onError: () => toast.error('Error al actualizar'),
  });

  return (
    <Card className="mb-4">
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-semibold text-gray-900">{order.order_number}</p>
            <p className="text-sm text-gray-500">
              {order.user?.name || 'Cliente'} - {new Date(order.created_at).toLocaleDateString('es-AR')}
            </p>
          </div>
          <div className="text-right">
            <PriceFormatter price={order.total} />
            <Badge className={`${config.color} mt-1`}>
              <StatusIcon className="w-3 h-3 mr-1" />
              {config.label}
            </Badge>
          </div>
        </div>
      </div>

      <div className="p-4">
        <h4 className="text-sm font-medium text-gray-700 mb-2">Productos:</h4>
        <div className="space-y-2">
          {order.items?.map((item) => (
            <div key={item.id} className="flex items-center justify-between text-sm">
              <span className="text-gray-600">
                {item.product?.name || 'Producto'} x{item.quantity}
              </span>
              <PriceFormatter price={item.total} />
            </div>
          ))}
        </div>
      </div>

      {order.status !== 'cancelled' && order.status !== 'delivered' && (
        <div className="p-4 border-t border-gray-100 bg-gray-50">
          <p className="text-sm text-gray-600 mb-3">Actualizar estado:</p>
          <div className="flex flex-wrap gap-2">
            {order.status === 'pending' && (
              <Button size="sm" onClick={() => updateStatus.mutate('processing')}>
                Procesar
              </Button>
            )}
            {order.status === 'processing' && (
              <Button size="sm" onClick={() => updateStatus.mutate('shipped')}>
                Marcar Enviado
              </Button>
            )}
            {order.status === 'shipped' && (
              <Button size="sm" onClick={() => updateStatus.mutate('delivered')}>
                Marcar Entregado
              </Button>
            )}
            {order.status !== 'cancelled' && (
              <Button 
                size="sm" 
                variant="danger"
                onClick={() => updateStatus.mutate('cancelled')}
              >
                Cancelar
              </Button>
            )}
          </div>
        </div>
      )}
    </Card>
  );
}

export function SellerOrdersPage() {
  const [status, setStatus] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['seller-orders', status],
    queryFn: () => orderService.getSellerOrders({ status: status || undefined }),
  });

  const orders = data?.data?.data || [];

  return (
    <Layout>
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-2xl font-bold text-gray-900">Pedidos</h1>
          <p className="text-gray-500">Gestiona los pedidos de tus productos</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex space-x-2 mb-6 overflow-x-auto pb-2">
          <Button
            variant={status === '' ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setStatus('')}
          >
            Todos
          </Button>
          <Button
            variant={status === 'pending' ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setStatus('pending')}
          >
            Pendientes
          </Button>
          <Button
            variant={status === 'processing' ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setStatus('processing')}
          >
            Procesando
          </Button>
          <Button
            variant={status === 'shipped' ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setStatus('shipped')}
          >
            Enviados
          </Button>
          <Button
            variant={status === 'delivered' ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setStatus('delivered')}
          >
            Entregados
          </Button>
        </div>

        {isLoading ? (
          <Spinner size="lg" />
        ) : orders.length === 0 ? (
          <div className="text-center py-16">
            <ShoppingBag className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No hay pedidos</h3>
            <p className="text-gray-500">Los pedidos aparecerán aquí cuando los clientes compren tus productos</p>
          </div>
        ) : (
          <div>
            {orders.map((order) => (
              <OrderCard key={order.id} order={order} />
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
