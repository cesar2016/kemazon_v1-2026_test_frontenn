import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Gavel, Save, Calendar } from 'lucide-react';
import { auctionService, productService } from '../../services/api';
import { Layout } from '../../components/layout';
import { Button, Input, Card, Badge } from '../../components/ui';
import { toast } from 'sonner';

export function AuctionFormPage() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    product_id: '',
    starting_price: '',
    reserve_price: '',
    buy_now_price: '',
    starts_at: '',
    ends_at: '',
    has_reserve: false,
  });
  const [loading, setLoading] = useState(false);

  const { data: productsData } = useQuery({
    queryKey: ['my-products', 'auctionable'],
    queryFn: () => productService.getMyProducts({ per_page: 100 }),
  });

  const products = productsData?.data?.data || [];
  const auctionableProducts = products.filter(p => 
    p.type === 'auction' || p.type === 'both' || !p.auction
  );

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const data = {
        ...form,
        starting_price: parseFloat(form.starting_price),
        reserve_price: form.reserve_price ? parseFloat(form.reserve_price) : null,
        buy_now_price: form.buy_now_price ? parseFloat(form.buy_now_price) : null,
        starts_at: new Date(form.starts_at).toISOString(),
        ends_at: new Date(form.ends_at).toISOString(),
      };

      await auctionService.create(data);
      toast.success('Subasta creada');
      navigate('/seller/dashboard');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error al crear la subasta');
    } finally {
      setLoading(false);
    }
  };

  const selectedProduct = products.find(p => p.id === parseInt(form.product_id));

  return (
    <Layout>
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Link to="/seller/dashboard" className="inline-flex items-center text-gray-500 hover:text-gray-700 mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" /> Volver al Dashboard
          </Link>
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center">
              <Gavel className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Nueva Subasta</h1>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Producto a Subastar</h2>
            
            {auctionableProducts.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500 mb-4">No tienes productos disponibles para subastar</p>
                <Link to="/seller/products/create">
                  <Button>Crear un producto</Button>
                </Link>
              </div>
            ) : (
              <select
                name="product_id"
                value={form.product_id}
                onChange={handleChange}
                className="input"
                required
              >
                <option value="">Seleccionar producto</option>
                {auctionableProducts.map(product => (
                  <option key={product.id} value={product.id}>
                    {product.name} - Stock: {product.stock}
                  </option>
                ))}
              </select>
            )}

            {selectedProduct && (
              <div className="mt-4 p-4 bg-gray-50 rounded-xl">
                <div className="flex items-center space-x-4">
                  {selectedProduct.images?.[0] ? (
                    <img 
                      src={selectedProduct.images[0]} 
                      alt={selectedProduct.name}
                      className="w-20 h-20 object-cover rounded-lg"
                    />
                  ) : (
                    <div className="w-20 h-20 bg-gray-200 rounded-lg flex items-center justify-center">
                      <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}
                  <div>
                    <p className="font-medium text-gray-900">{selectedProduct.name}</p>
                    <p className="text-sm text-gray-500">{selectedProduct.description?.substring(0, 100)}...</p>
                    <Badge variant="primary" className="mt-2">
                      Precio en tienda: ${selectedProduct.price}
                    </Badge>
                  </div>
                </div>
              </div>
            )}
          </Card>

          <Card className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Configuración de Precios</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="label">Precio Base (ARS) *</label>
                  <Input
                    type="number"
                    name="starting_price"
                    value={form.starting_price}
                    onChange={handleChange}
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">Precio inicial de la subasta</p>
                </div>

                <div>
                  <label className="label">Precio de Compra Inmediata (ARS)</label>
                  <Input
                    type="number"
                    name="buy_now_price"
                    value={form.buy_now_price}
                    onChange={handleChange}
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                  />
                  <p className="text-xs text-gray-500 mt-1">Opcional: precio para comprar directamente</p>
                </div>
              </div>

              <div>
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    name="has_reserve"
                    checked={form.has_reserve}
                    onChange={handleChange}
                    className="w-5 h-5 text-primary-600 rounded"
                  />
                  <span>Habilitar precio de reserva</span>
                </label>
              </div>

              {form.has_reserve && (
                <div>
                  <label className="label">Precio de Reserva (ARS)</label>
                  <Input
                    type="number"
                    name="reserve_price"
                    value={form.reserve_price}
                    onChange={handleChange}
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    La subasta solo se gana si se alcanza este precio
                  </p>
                </div>
              )}
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Fechas de la Subasta</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label">
                  <Calendar className="w-4 h-4 inline mr-2" />
                  Fecha y Hora de Inicio *
                </label>
                <Input
                  type="datetime-local"
                  name="starts_at"
                  value={form.starts_at}
                  onChange={handleChange}
                  required
                />
              </div>

              <div>
                <label className="label">
                  <Calendar className="w-4 h-4 inline mr-2" />
                  Fecha y Hora de Fin *
                </label>
                <Input
                  type="datetime-local"
                  name="ends_at"
                  value={form.ends_at}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="mt-4 p-4 bg-orange-50 rounded-xl">
              <p className="text-sm text-orange-800">
                <strong>Importante:</strong> Una vez que haya pujas, no podrás modificar la fecha de fin ni el precio base.
              </p>
            </div>
          </Card>

          <div className="flex items-center justify-end space-x-4">
            <Button type="button" variant="secondary" onClick={() => navigate('/seller/dashboard')}>
              Cancelar
            </Button>
            <Button type="submit" loading={loading}>
              <Save className="w-5 h-5 mr-2" />
              Crear Subasta
            </Button>
          </div>
        </form>
      </div>
    </Layout>
  );
}
