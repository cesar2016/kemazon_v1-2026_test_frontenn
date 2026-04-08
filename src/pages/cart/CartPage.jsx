import { useCart } from '../../contexts/CartContext';
import { Layout } from '../../components/layout';
import { Button, Card, PriceFormatter } from '../../components/ui';
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export function CartPage() {
    const { items, totalAmount, updateItem, removeItem, loading } = useCart();

    if (loading && items.length === 0) {
        return (
            <Layout>
                <div className="flex justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                </div>
            </Layout>
        );
    }

    if (items.length === 0) {
        return (
            <Layout>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
                    <Card className="p-12 text-center max-w-2xl mx-auto border-2 border-dashed border-gray-200 bg-gray-50/50">
                        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <ShoppingBag className="w-10 h-10 text-gray-400" />
                        </div>
                        <h1 className="text-2xl font-black text-gray-900 mb-2">Tu carrito está vacío</h1>
                        <p className="text-gray-500 mb-8 font-medium">
                            Parece que aún no has agregado nada a tu carrito. ¡Explora nuestros productos y subastas!
                        </p>
                        <Link to="/products">
                            <Button className="font-bold px-8">
                                Ir a la tienda
                            </Button>
                        </Link>
                    </Card>
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <h1 className="text-3xl font-black text-gray-900 mb-8 tracking-tighter uppercase italic">
                    Tu Carrito <span className="text-primary-600">({items.length})</span>
                </h1>

                <div className="grid lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-4">
                        {items.map((item) => (
                            <Card key={item.id} className="p-4 flex gap-4 items-center">
                                <div className="w-24 h-24 bg-gray-100 rounded-xl overflow-hidden flex-shrink-0 border border-gray-100">
                                    {item.product?.thumbnail || item.product?.images?.[0] ? (
                                        <img
                                            src={item.product?.thumbnail || item.product?.images?.[0]}
                                            alt={item.product?.name}
                                            className="w-full h-full object-cover"
                                            onError={(e) => {
                                                e.target.src = 'https://via.placeholder.com/150?text=Sin+Imagen';
                                            }}
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-gray-50 text-gray-400">
                                            <ShoppingBag className="w-8 h-8 opacity-20" />
                                        </div>
                                    )}
                                </div>

                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h3 className="font-black text-gray-900 truncate">
                                                <Link to={`/products/${item.product?.slug}`} className="hover:text-primary-600 transition-colors">
                                                    {item.product?.name}
                                                </Link>
                                            </h3>
                                            <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mt-0.5">
                                                {item.type === 'auction' ? 'Subasta Ganada' : 'Venta Directa'}
                                            </p>
                                        </div>
                                        <button
                                            onClick={() => removeItem(item.id)}
                                            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>

                                    <div className="flex items-center justify-between mt-4">
                                        <div className="flex items-center gap-4">
                                            {item.type === 'direct' ? (
                                                <div className="flex items-center border border-gray-200 rounded-lg bg-gray-50 p-1">
                                                    <button
                                                        onClick={() => updateItem(item.id, Math.max(1, item.quantity - 1))}
                                                        className="p-1 hover:bg-white rounded-md transition-colors"
                                                    >
                                                        <Minus className="w-3 h-3" />
                                                    </button>
                                                    <span className="w-8 text-center text-sm font-black">{item.quantity}</span>
                                                    <button
                                                        onClick={() => updateItem(item.id, item.quantity + 1)}
                                                        className="p-1 hover:bg-white rounded-md transition-colors"
                                                    >
                                                        <Plus className="w-3 h-3" />
                                                    </button>
                                                </div>
                                            ) : (
                                                <span className="text-sm font-black text-gray-700 bg-amber-100 text-amber-800 px-3 py-1 rounded-full border border-amber-200">
                                                    Cantidad: 1
                                                </span>
                                            )}
                                        </div>

                                        <div className="text-right">
                                            <PriceFormatter price={item.price * item.quantity} className="text-lg font-black text-gray-900" />
                                            {item.quantity > 1 && (
                                                <p className="text-[10px] text-gray-400 font-bold uppercase">
                                                    <PriceFormatter price={item.price} /> c/u
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>

                    <div className="lg:col-span-1">
                        <Card className="p-6 sticky top-24 border-2 border-primary-100 bg-primary-50/10">
                            <h2 className="text-sm font-black text-gray-900 uppercase tracking-widest mb-6 px-1 border-l-4 border-primary-500">
                                Resumen de Compra
                            </h2>

                            <div className="space-y-4 mb-6">
                                <div className="flex justify-between text-sm font-bold text-gray-500">
                                    <span>Productos ({items.length})</span>
                                    <PriceFormatter price={totalAmount} />
                                </div>
                                <div className="flex justify-between text-sm font-bold text-gray-500">
                                    <span>Envío</span>
                                    <span className="text-green-600 italic">¡Gratis!</span>
                                </div>
                                <hr className="border-primary-100" />
                                <div className="flex justify-between items-center pt-2">
                                    <span className="text-lg font-black text-gray-900">Total</span>
                                    <PriceFormatter price={totalAmount} className="text-2xl font-black text-primary-600" />
                                </div>
                            </div>

                            <Link to="/checkout">
                                <Button className="w-full font-black py-4 rounded-xl shadow-lg shadow-primary-200">
                                    <span>Continuar compra</span>
                                    <ArrowRight className="w-5 h-5 ml-2" />
                                </Button>
                            </Link>

                            <div className="mt-6 flex flex-col gap-3">
                                <div className="flex items-center gap-3 text-[10px] text-gray-500 font-bold uppercase tracking-tighter">
                                    <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center text-green-600">✓</div>
                                    Compra protegida por Kemazon
                                </div>
                                <div className="flex items-center gap-3 text-[10px] text-gray-500 font-bold uppercase tracking-tighter">
                                    <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">🛡</div>
                                    Garantía de devolución 30 días
                                </div>
                            </div>
                        </Card>
                    </div>
                </div>
            </div>
        </Layout>
    );
}
