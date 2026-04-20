import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Filter, Grid, List, Search, Eye, Heart } from 'lucide-react';
import { productService, categoryService } from '../../services/api';
import { Layout } from '../../components/layout';
import { Card, Badge, PriceFormatter, Spinner, Button, ProductImage } from '../../components/ui';

function ProductCard({ product }) {
  return (
    <a href={`/products/${product.slug}`} className="block">
      <Card hover className="h-full">
        <div className="relative aspect-square overflow-hidden bg-gray-100">
          <ProductImage
            src={product.thumbnail}
            fallbackSrcs={[product.images?.[0]]}
            alt={product.name}
            className="w-full h-full object-cover"
            loading="lazy"
          />
          {product.type === 'auction' && (
            <Badge variant="warning" className="absolute top-3 left-3">
              Subasta
            </Badge>
          )}
        </div>
        <div className="p-4">
          <h3 className="font-medium text-gray-900 line-clamp-2 mb-2">{product.name}</h3>
          <div className="flex items-center gap-3 mb-3">
            <p className="text-sm text-gray-500">{product.category?.name}</p>
            <div className="flex items-center gap-3 ml-auto">
              <div className="flex items-center text-[10px] text-gray-400 font-medium">
                <Eye className="w-3 h-3 mr-1 text-gray-400" />
                {product.visits_count || 0}
              </div>
              <div className="flex items-center text-[10px] text-gray-400 font-medium">
                <Heart className="w-3 h-3 mr-1 text-gray-400" />
                {product.likes_count || 0}
              </div>
            </div>
          </div>
          {product.type === 'direct' ? (
            <PriceFormatter price={product.price} />
          ) : (
            <span className="text-primary-600 font-semibold">Ver en Subasta</span>
          )}
        </div>
      </Card>
    </a>
  );
}

export function ProductsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [viewMode, setViewMode] = useState('grid');
  const [showFilters, setShowFilters] = useState(false);

  const search = searchParams.get('search') || '';
  const category = searchParams.get('category') || '';
  const type = searchParams.get('type') || '';
  const sort = searchParams.get('sort') || 'created_at';
  const direction = searchParams.get('direction') || 'desc';
  const page = parseInt(searchParams.get('page') || '1');

  const { data: productsData, isLoading } = useQuery({
    queryKey: ['products', { search, category, type, sort, direction, page }],
    queryFn: () => productService.getAll({
      search: search || undefined,
      category: category || undefined,
      type: type || undefined,
      sort,
      direction,
      page,
      per_page: 20,
    }),
  });

  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoryService.getAll(),
  });

  const products = productsData?.data?.data || [];
  const pagination = productsData?.data;
  const categories = categoriesData?.data?.categories || [];

  const updateParams = (key, value) => {
    const newParams = new URLSearchParams(searchParams);
    if (value) {
      newParams.set(key, value);
    } else {
      newParams.delete(key);
    }
    newParams.delete('page');
    setSearchParams(newParams);
  };

  return (
    <Layout>
      <div className="bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">
            {search ? `Resultados para "${search}"` : category ? 'Categoría' : 'Todos los Productos'}
          </h1>

          <div className="flex flex-col lg:flex-row gap-6">
            <aside className={`lg:w-64 flex-shrink-0 ${showFilters ? 'block' : 'hidden lg:block'}`}>
              <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm">
                <h3 className="font-semibold text-gray-900 mb-4">Categorías</h3>
                <div className="space-y-2">
                  <button
                    onClick={() => updateParams('category', '')}
                    className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${!category ? 'bg-primary-50 text-primary-600' : 'text-gray-600 hover:bg-gray-50'
                      }`}
                  >
                    Todas
                  </button>
                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => updateParams('category', cat.slug)}
                      className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${category === cat.slug ? 'bg-primary-50 text-primary-600' : 'text-gray-600 hover:bg-gray-50'
                        }`}
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>

                <h3 className="font-semibold text-gray-900 mb-4 mt-6">Tipo</h3>
                <div className="space-y-2">
                  {[
                    { value: '', label: 'Todos' },
                    { value: 'direct', label: 'Venta Directa' },
                    { value: 'auction', label: 'Subastas' },
                  ].map((option) => (
                    <button
                      key={option.value}
                      onClick={() => updateParams('type', option.value)}
                      className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${type === option.value ? 'bg-primary-50 text-primary-600' : 'text-gray-600 hover:bg-gray-50'
                        }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>

                <h3 className="font-semibold text-gray-900 mb-4 mt-6">Ordenar por</h3>
                <select
                  value={`${sort}-${direction}`}
                  onChange={(e) => {
                    const [newSort, newDir] = e.target.value.split('-');
                    updateParams('sort', newSort);
                    updateParams('direction', newDir);
                  }}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200"
                >
                  <option value="created_at-desc">Más Recientes</option>
                  <option value="created_at-asc">Más Antiguos</option>
                  <option value="price-asc">Precio: Menor a Mayor</option>
                  <option value="price-desc">Precio: Mayor a Menor</option>
                  <option value="name-asc">Nombre: A-Z</option>
                  <option value="name-desc">Nombre: Z-A</option>
                </select>
              </div>
            </aside>

            <main className="flex-1">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => setShowFilters(!showFilters)}
                    className="lg:hidden flex items-center space-x-2 px-4 py-2 bg-white rounded-xl shadow-sm border border-gray-200"
                  >
                    <Filter className="w-5 h-5" />
                    <span className="text-sm font-medium">Filtros</span>
                  </button>
                  <span className="text-gray-500">
                    {pagination?.total || 0} productos
                  </span>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-2 rounded-lg ${viewMode === 'grid' ? 'bg-primary-100 text-primary-600' : 'text-gray-400'}`}
                  >
                    <Grid className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-2 rounded-lg ${viewMode === 'list' ? 'bg-primary-100 text-primary-600' : 'text-gray-400'}`}
                  >
                    <List className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {isLoading ? (
                <div className="py-12">
                  <Spinner size="lg" />
                </div>
              ) : products.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-2xl">
                  <Search className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No se encontraron productos</h3>
                  <p className="text-gray-500">Intenta con otra búsqueda o ajusta los filtros</p>
                </div>
              ) : (
                <>
                  <div className={viewMode === 'grid'
                    ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
                    : 'space-y-4'
                  }>
                    {products.map((product) => (
                      <ProductCard key={product.id} product={product} />
                    ))}
                  </div>

                  {pagination?.last_page > 1 && (
                    <div className="flex items-center justify-center flex-wrap gap-2 mt-8">
                      {pagination.current_page > 1 && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateParams('page', String(pagination.current_page - 1))}
                        >
                          Anterior
                        </Button>
                      )}
                      <span className="px-3 py-2 text-sm">
                        {pagination.current_page} / {pagination.last_page}
                      </span>
                      {pagination.current_page < pagination.last_page && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateParams('page', String(pagination.current_page + 1))}
                        >
                          Siguiente
                        </Button>
                      )}
                    </div>
                  )}
                </>
              )}
            </main>
          </div>
        </div>
      </div>
    </Layout>
  );
}
