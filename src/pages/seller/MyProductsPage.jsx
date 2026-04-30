import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit, Trash2, Eye, EyeOff, Package } from 'lucide-react';
import { productService } from '../../services/api';
import { Layout } from '../../components/layout';
import { Button, Card, Badge, PriceFormatter, Spinner, Modal, CountdownTimer, ProductImage } from '../../components/ui';
import { toast } from 'sonner';

function ProductRow({ product }) {
  const queryClient = useQueryClient();
  const [showDelete, setShowDelete] = useState(false);

  const toggleActive = useMutation({
    mutationFn: (isActive) => productService.update(product.id, { is_active: isActive }),
    onSuccess: () => {
      queryClient.invalidateQueries(['my-products']);
      toast.success('Estado actualizado');
    },
    onError: () => toast.error('Error al actualizar'),
  });

  const deleteProduct = useMutation({
    mutationFn: () => productService.delete(product.id),
    onSuccess: () => {
      queryClient.invalidateQueries(['my-products']);
      toast.success('Producto eliminado');
      setShowDelete(false);
    },
    onError: () => toast.error('Error al eliminar'),
  });

  const isAuction = product.type === 'auction';
  const auction = product.auction;
  const hasActiveBids = auction && auction.bids?.length > 0;
  const isAuctionActive = auction && auction.is_active && auction.status === 'active';
  const auctionEnded = auction && auction.status === 'ended';
  const canEdit = !isAuction || (!isAuctionActive && !hasActiveBids) || auctionEnded;

  const displayPrice = isAuction ? auction?.starting_price : product.price;

  const typeLabel = isAuction ? 'Subasta' : 'Venta Directa';

  return (
    <>
      <tr className="border-b border-gray-100 hover:bg-gray-50">
        <td className="py-4 px-4">
          <ProductImage
            src={product.thumbnail}
            fallbackSrcs={[product.images?.[0]]}
            alt={product.name}
            className="w-14 h-14 object-cover rounded-lg"
          />
        </td>
        <td className="py-4 px-4">
          <p className="font-medium text-gray-900">{product.name}</p>
          <p className="text-sm text-gray-500">{product.category?.name || 'Sin categoría'}</p>
        </td>
        <td className="py-4 px-4">
          <PriceFormatter price={displayPrice} />
        </td>
        <td className="py-4 px-4">
          <span className="text-gray-700">{product.stock}</span>
        </td>
        <td className="py-4 px-4">
          <Badge variant={product.is_active ? 'success' : 'danger'}>
            {product.is_active ? 'Activo' : 'Inactivo'}
          </Badge>
        </td>
        <td className="py-4 px-4">
          <Badge variant="primary">{typeLabel}</Badge>
        </td>
        <td className="py-4 px-4">
          {isAuction && auction?.ends_at ? (
            <CountdownTimer endDate={auction.ends_at} size="small" />
          ) : (
            <span className="text-gray-400 text-xs">-</span>
          )}
        </td>
        <td className="py-4 px-4">
          {canEdit ? (
            <div className="flex items-center space-x-2">
              <Link to={`/seller/products/${product.id}`}>
                <Button variant="ghost" size="sm">
                  <Edit className="w-4 h-4" />
                </Button>
              </Link>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => toggleActive.mutate(!product.is_active)}
              >
                {product.is_active ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowDelete(true)}
                className="text-red-600 hover:text-red-700"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ) : (
            <span className="text-xs text-gray-400 italic">
              {hasActiveBids ? 'En remate' : auctionEnded ? 'Finalizada' : 'Subasta activa'}
            </span>
          )}
        </td>
      </tr>

      <Modal isOpen={showDelete} onClose={() => setShowDelete(false)} title="Eliminar Producto">
        <p className="text-gray-600 mb-6">
          ¿Estás seguro de que deseas eliminar "{product.name}"? Esta acción no se puede deshacer.
        </p>
        <div className="flex justify-end space-x-3">
          <Button variant="secondary" onClick={() => setShowDelete(false)}>
            Cancelar
          </Button>
          <Button variant="danger" onClick={() => deleteProduct.mutate()} loading={deleteProduct.isPending}>
            Eliminar
          </Button>
        </div>
      </Modal>
    </>
  );
}

export function MyProductsPage() {
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['my-products', page],
    queryFn: () => productService.getMyProducts({ page, per_page: 20 }),
  });

  const products = data?.data?.data || [];
  const pagination = data?.data;

  return (
    <Layout>
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Mis Productos</h1>
              <p className="text-gray-500">{pagination?.total || 0} productos</p>
            </div>
            <Link to="/seller/products/create">
              <Button>
                <Plus className="w-5 h-5 mr-2" /> Nuevo Producto
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          {isLoading ? (
            <div className="p-8">
              <Spinner size="lg" />
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-16">
              <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No tienes productos</h3>
              <p className="text-gray-500 mb-6">Comienza a vender creando tu primer producto</p>
              <Link to="/seller/products/create">
                <Button>
                  <Plus className="w-5 h-5 mr-2" /> Crear Producto
                </Button>
              </Link>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50">
                      <th className="py-3 px-4 text-left text-sm font-semibold text-gray-600">Imagen</th>
                      <th className="py-3 px-4 text-left text-sm font-semibold text-gray-600">Producto</th>
                      <th className="py-3 px-4 text-left text-sm font-semibold text-gray-600">Precio</th>
                      <th className="py-3 px-4 text-left text-sm font-semibold text-gray-600">Stock</th>
                      <th className="py-3 px-4 text-left text-sm font-semibold text-gray-600">Estado</th>
                      <th className="py-3 px-4 text-left text-sm font-semibold text-gray-600">Tipo</th>
                      <th className="py-3 px-4 text-left text-sm font-semibold text-gray-600">Finaliza</th>
                      <th className="py-3 px-4 text-left text-sm font-semibold text-gray-600">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((product) => (
                      <ProductRow key={product.id} product={product} />
                    ))}
                  </tbody>
                </table>
              </div>

              {pagination?.last_page > 1 && (
                <div className="flex items-center justify-between p-4 border-t border-gray-100">
                  <p className="text-sm text-gray-500">
                    Mostrando {pagination?.from || 0} - {pagination?.to || 0} de {pagination?.total}
                  </p>
                  <div className="flex space-x-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      disabled={!pagination?.prev_page_url}
                      onClick={() => setPage(p => p - 1)}
                    >
                      Anterior
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      disabled={!pagination?.next_page_url}
                      onClick={() => setPage(p => p + 1)}
                    >
                      Siguiente
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </Card>
      </div>
    </Layout>
  );
}
