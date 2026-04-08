import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Save, AlertCircle, Calendar } from 'lucide-react';
import { productService, categoryService, auctionService } from '../../services/api';
import { Layout } from '../../components/layout';
import { Button, Input, Card } from '../../components/ui';
import { ImageUpload } from '../../components/ui/ImageUpload';
import { toast } from 'sonner';

export function ProductFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = !!id;

  const [form, setForm] = useState({
    name: '',
    description: '',
    category_id: '',
    price: '',
    stock: '',
    type: 'direct',
    specifications: '',
    is_active: true,
  });

  const [images, setImages] = useState([]);

  const [auctionSettings, setAuctionSettings] = useState({
    starting_price: '',
    reserve_price: '',
    buy_now_price: '',
    starts_at: '',
    ends_at: '',
    has_reserve: false,
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const { data: productData } = useQuery({
    queryKey: ['product', id],
    queryFn: () => productService.getById(id),
    enabled: isEditing,
  });

  useEffect(() => {
    if (productData?.data?.product) {
      const product = productData.data.product;
      setForm({
        name: product.name || '',
        description: product.description || '',
        category_id: product.category_id || '',
        price: product.price || '',
        stock: product.stock || '',
        type: product.type || 'direct',
        specifications: product.specifications || '',
        is_active: product.is_active ?? true,
      });
      
      if (product.images && product.images.length > 0) {
        setImages(product.images.map((url, index) => ({
          url,
          isPrimary: index === 0,
        })));
      }

      if (product.auction) {
        setAuctionSettings({
          starting_price: product.auction.starting_price || '',
          reserve_price: product.auction.reserve_price || '',
          buy_now_price: product.auction.buy_now_price || '',
          starts_at: product.auction.starts_at ? new Date(product.auction.starts_at).toISOString().slice(0, 16) : '',
          ends_at: product.auction.ends_at ? new Date(product.auction.ends_at).toISOString().slice(0, 16) : '',
          has_reserve: product.auction.has_reserve || false,
        });
      }
    }
  }, [productData]);

  useEffect(() => {
    if (form.type === 'auction') {
      const now = new Date();
      const in5Days = new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000);
      
      const formatDate = (date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        return `${year}-${month}-${day}T${hours}:${minutes}`;
      };

      setAuctionSettings(prev => ({
        ...prev,
        starts_at: formatDate(now),
        ends_at: formatDate(in5Days),
      }));
    }
  }, [form.type]);

  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoryService.getAll(),
  });

  const categories = categoriesData?.data?.categories || [];

  const validateForm = () => {
    const newErrors = {};

    if (!form.name.trim()) {
      newErrors.name = 'El nombre es requerido';
    } else if (form.name.length < 3) {
      newErrors.name = 'El nombre debe tener al menos 3 caracteres';
    }

    if (form.type !== 'auction' && (!form.price || parseFloat(form.price) <= 0)) {
      newErrors.price = 'El precio debe ser mayor a 0';
    }

    if (form.type !== 'auction' && (!form.stock || parseInt(form.stock) < 0)) {
      newErrors.stock = 'El stock es requerido';
    }

    if (images.length === 0) {
      newErrors.images = 'Debes agregar al menos una imagen';
    }

    if (form.type === 'auction') {
      if (!auctionSettings.starting_price || parseFloat(auctionSettings.starting_price) <= 0) {
        newErrors.auction_starting_price = 'El precio base es requerido para subastas';
      }

      if (!auctionSettings.starts_at) {
        newErrors.starts_at = 'La fecha de inicio es requerida';
      }

      if (!auctionSettings.ends_at) {
        newErrors.ends_at = 'La fecha de fin es requerida';
      }

      if (auctionSettings.starts_at && auctionSettings.ends_at) {
        const start = new Date(auctionSettings.starts_at);
        const end = new Date(auctionSettings.ends_at);
        const diffDays = (end - start) / (1000 * 60 * 60 * 24);

        if (end <= start) {
          newErrors.ends_at = 'La fecha de fin debe ser posterior a la fecha de inicio';
        } else if (diffDays < 5) {
          newErrors.ends_at = 'La subasta debe durar al menos 5 días';
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const handleAuctionChange = (e) => {
    const { name, value, type, checked } = e.target;
    setAuctionSettings(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Por favor, corrige los errores en el formulario');
      return;
    }

    setLoading(true);

    try {
      const imageUrls = images.map(img => img.url);
      const thumbnail = images.find(img => img.isPrimary)?.url || images[0]?.url;

      const productData = {
        name: form.name.trim(),
        description: form.description.trim(),
        category_id: form.category_id || null,
        price: parseFloat(form.price),
        stock: parseInt(form.stock),
        type: form.type,
        images: imageUrls,
        thumbnail: thumbnail,
        specifications: form.specifications,
        is_active: form.is_active,
      };

      let productId;

      if (isEditing) {
        await productService.update(id, productData);
        productId = id;
        toast.success('Producto actualizado');
      } else {
        const response = await productService.create(productData);
        productId = response.data.product.id;
        toast.success('Producto creado');
      }

      if (form.type === 'auction' && !isEditing) {
        await auctionService.create({
          product_id: productId,
          starting_price: parseFloat(auctionSettings.starting_price),
          reserve_price: auctionSettings.reserve_price ? parseFloat(auctionSettings.reserve_price) : null,
          buy_now_price: auctionSettings.buy_now_price ? parseFloat(auctionSettings.buy_now_price) : null,
          starts_at: new Date(auctionSettings.starts_at).toISOString(),
          ends_at: new Date(auctionSettings.ends_at).toISOString(),
          has_reserve: auctionSettings.has_reserve,
        });
        toast.success('Subasta creada');
      }

      navigate('/seller/dashboard');
    } catch (error) {
      const message = error.response?.data?.errors 
        ? Object.values(error.response.data.errors).flat().join(', ')
        : error.response?.data?.message || 'Error al guardar';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const getMinEndDate = () => {
    if (!auctionSettings.starts_at) return '';
    const start = new Date(auctionSettings.starts_at);
    start.setDate(start.getDate() + 5);
    return start.toISOString().slice(0, 16);
  };

  return (
    <Layout>
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Link to="/seller/dashboard" className="inline-flex items-center text-gray-500 hover:text-gray-700 mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" /> Volver al Dashboard
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">
            {isEditing ? 'Editar Producto' : 'Nuevo Producto'}
          </h1>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Información General</h2>
            <div className="space-y-4">
              <div>
                <label className="label">Nombre del producto *</label>
                <Input
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Ej: iPhone 15 Pro Max 256GB"
                  error={errors.name}
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-500 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-1" /> {errors.name}
                  </p>
                )}
              </div>

              <div>
                <label className="label">Descripción</label>
                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  placeholder="Describe tu producto en detalle..."
                  rows={4}
                  className={`input ${errors.description ? 'border-red-500' : ''}`}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="label">Categoría</label>
                  <select
                    name="category_id"
                    value={form.category_id}
                    onChange={handleChange}
                    className="input"
                  >
                    <option value="">Seleccionar categoría</option>
                    {categories.map(cat => (
                      <optgroup key={cat.id} label={cat.name}>
                        <option value={cat.id}>{cat.name}</option>
                        {cat.children?.map(child => (
                          <option key={child.id} value={child.id}>  {child.name}</option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="label">Tipo de Venta *</label>
                  <select
                    name="type"
                    value={form.type}
                    onChange={handleChange}
                    className="input"
                  >
                    <option value="direct">Venta Directa</option>
                    <option value="auction">Solo Subasta</option>
                  </select>
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Imágenes *</h2>
            <ImageUpload 
              images={images} 
              setImages={setImages} 
              maxImages={6}
            />
            {errors.images && (
              <p className="mt-2 text-sm text-red-500 flex items-center">
                <AlertCircle className="w-4 h-4 mr-1" /> {errors.images}
              </p>
            )}
            <p className="mt-3 text-sm text-gray-500">
              Arrastra las imágenes o haz clic para seleccionar. La imagen con estrella será la principal.
            </p>
          </Card>

          <Card className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Precio y Stock</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {form.type !== 'auction' && (
                <div>
                  <label className="label">Precio de Venta (ARS) *</label>
                  <Input
                    type="number"
                    name="price"
                    value={form.price}
                    onChange={handleChange}
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    error={errors.price}
                  />
                  {errors.price && (
                    <p className="mt-1 text-sm text-red-500 flex items-center">
                      <AlertCircle className="w-4 h-4 mr-1" /> {errors.price}
                    </p>
                  )}
                </div>
              )}

              {form.type !== 'auction' && (
                <div>
                  <label className="label">Stock *</label>
                  <Input
                    type="number"
                    name="stock"
                    value={form.stock}
                    onChange={handleChange}
                    placeholder="0"
                    min="0"
                    error={errors.stock}
                  />
                  {errors.stock && (
                    <p className="mt-1 text-sm text-red-500 flex items-center">
                      <AlertCircle className="w-4 h-4 mr-1" /> {errors.stock}
                    </p>
                  )}
                </div>
              )}
            </div>
          </Card>

          {form.type === 'auction' && (
            <Card className="p-6 border-2 border-orange-200 bg-orange-50/50">
              <div className="flex items-center mb-4">
                <Calendar className="w-5 h-5 text-orange-600 mr-2" />
                <h2 className="text-lg font-semibold text-gray-900">Configuración de Subasta</h2>
              </div>

              <div className="space-y-4">
                <div className="bg-orange-100 p-3 rounded-lg mb-4">
                  <p className="text-sm text-orange-800">
                    <strong>Importante:</strong> La duración mínima de la subasta es de 5 días.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="label">Precio Base (ARS) *</label>
                    <Input
                      type="number"
                      name="starting_price"
                      value={auctionSettings.starting_price}
                      onChange={handleAuctionChange}
                      placeholder="0.00"
                      min="0"
                      step="0.01"
                      error={errors.auction_starting_price}
                    />
                    {errors.auction_starting_price && (
                      <p className="mt-1 text-sm text-red-500 flex items-center">
                        <AlertCircle className="w-4 h-4 mr-1" /> {errors.auction_starting_price}
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="label">Fecha y Hora de Inicio *</label>
                    <Input
                      type="datetime-local"
                      name="starts_at"
                      value={auctionSettings.starts_at}
                      onChange={handleAuctionChange}
                      min={new Date().toISOString().slice(0, 16)}
                      error={errors.starts_at}
                    />
                    {errors.starts_at && (
                      <p className="mt-1 text-sm text-red-500 flex items-center">
                        <AlertCircle className="w-4 h-4 mr-1" /> {errors.starts_at}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="label">Fecha y Hora de Fin * (mín. 5 días)</label>
                    <Input
                      type="datetime-local"
                      name="ends_at"
                      value={auctionSettings.ends_at}
                      onChange={handleAuctionChange}
                      min={getMinEndDate()}
                      error={errors.ends_at}
                    />
                    {errors.ends_at && (
                      <p className="mt-1 text-sm text-red-500 flex items-center">
                        <AlertCircle className="w-4 h-4 mr-1" /> {errors.ends_at}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          )}

          <Card className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Configuración</h2>
            <label className="flex items-center space-x-3">
              <input
                type="checkbox"
                name="is_active"
                checked={form.is_active}
                onChange={handleChange}
                className="w-5 h-5 text-primary-600 rounded"
              />
              <span>Producto activo (visible en la tienda)</span>
            </label>
          </Card>

          <div className="flex items-center justify-end space-x-4 pb-8">
            <Button type="button" variant="secondary" onClick={() => navigate('/seller/dashboard')}>
              Cancelar
            </Button>
            <Button type="submit" loading={loading}>
              <Save className="w-5 h-5 mr-2" />
              {isEditing ? 'Guardar Cambios' : 'Crear Producto'}
            </Button>
          </div>
        </form>
      </div>
    </Layout>
  );
}
