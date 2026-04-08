import { useCart } from '../../contexts/CartContext';
import { Layout } from '../../components/layout';
import { Card, Button, PriceFormatter } from '../../components/ui';
import { ShoppingBag, CreditCard, Truck, CheckCircle2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { addressService } from '../../services/api';
import { toast } from 'sonner';

export function CheckoutPage() {
    const { items, totalAmount, checkout } = useCart();
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [addresses, setAddresses] = useState([]);
    const [selectedAddressId, setSelectedAddressId] = useState(null);
    const [fetchingAddresses, setFetchingAddresses] = useState(true);
    const [lastCheckoutData, setLastCheckoutData] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchAddresses = async () => {
            try {
                const response = await addressService.getAll();
                const addr = response.data.addresses || [];
                setAddresses(addr);
                const def = addr.find(a => a.is_default) || addr[0];
                if (def) setSelectedAddressId(def.id);
            } catch (err) {
                console.error('Error fetching addresses:', err);
                toast.error('Error al cargar direcciones');
            } finally {
                setFetchingAddresses(false);
            }
        };
        fetchAddresses();
    }, []);

    const handleCheckout = async () => {
        if (!selectedAddressId) {
            toast.error('Por favor agrega una dirección de envío en tu perfil');
            return;
        }

        setLoading(true);
        try {
            const data = await checkout(selectedAddressId);
            setLastCheckoutData(data);

            if (data.payment_url) {
                // Redirect to MercadoPago
                window.location.href = data.payment_url;
                return;
            }

            setSuccess(true);
        } catch (error) {
            console.error('Error during checkout:', error);
            toast.error(error.response?.data?.message || 'Error al procesar el pedido');
        } finally {
            setLoading(false);
        }
    };

    const selectedAddress = addresses.find(a => a.id === selectedAddressId);

    if (success) {
        const hasPaymentUrl = lastCheckoutData?.has_payment_url || !!lastCheckoutData?.payment_url;

        return (
            <Layout>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
                    <Card className={`p-12 text-center max-w-2xl mx-auto border-2 ${hasPaymentUrl ? 'border-green-100 bg-green-50/10' : 'border-amber-100 bg-amber-50/10'}`}>
                        <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 ${hasPaymentUrl ? 'bg-green-100' : 'bg-amber-100'}`}>
                            <CheckCircle2 className={`w-10 h-10 ${hasPaymentUrl ? 'text-green-600' : 'text-amber-600'}`} />
                        </div>
                        <h1 className="text-3xl font-black text-gray-900 mb-2 tracking-tighter uppercase italic">
                            {hasPaymentUrl ? '¡Pedido Confirmado!' : '¡Pedido Registrado!'}
                        </h1>
                        <p className="text-gray-500 mb-6 font-medium">
                            {hasPaymentUrl
                                ? "Gracias por tu compra. Pronto recibirás un correo con los detalles del envío."
                                : "Tu pedido ha sido registrado, pero el vendedor aún no ha configurado su método de pago (MercadoPago)."}
                        </p>

                        {!hasPaymentUrl && (
                            <div className="bg-amber-100/50 border border-amber-200 rounded-xl p-4 mb-8 text-left">
                                <p className="text-sm text-amber-800 font-bold mb-1 uppercase tracking-tight">Nota Importante:</p>
                                <p className="text-xs text-amber-700 leading-relaxed">
                                    Para completar esta transacción, el vendedor debe configurar sus credenciales de MercadoPago. Si eres el dueño de estos productos, por favor ve a tu <strong>Perfil</strong> y completa la configuración de cobros.
                                </p>
                            </div>
                        )}

                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Button onClick={() => navigate('/')} variant={hasPaymentUrl ? 'primary' : 'outline'} className="font-bold px-8">
                                Volver al inicio
                            </Button>
                            {!hasPaymentUrl && (
                                <Button onClick={() => navigate('/profile')} className="font-bold px-8">
                                    Ir a mi Perfil
                                </Button>
                            )}
                        </div>
                    </Card>
                </div>
            </Layout>
        );
    }

    if (items.length === 0) {
        return (
            <Layout>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
                    <h2 className="text-2xl font-black mb-4">No hay productos para el checkout</h2>
                    <Button onClick={() => navigate('/products')}>Ir a la tienda</Button>
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <h1 className="text-3xl font-black text-gray-900 mb-8 tracking-tighter uppercase italic">Finalizar <span className="text-primary-600">Compra</span></h1>

                <div className="grid lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-6">
                        <Card className="p-6">
                            <div className="flex items-center gap-3 mb-6">
                                <Truck className="w-6 h-6 text-primary-600" />
                                <h2 className="text-lg font-black uppercase tracking-tight">Información de Envío</h2>
                            </div>

                            {fetchingAddresses ? (
                                <div className="h-24 bg-gray-50 animate-pulse rounded-xl"></div>
                            ) : addresses.length > 0 ? (
                                <div className="p-4 border border-primary-100 bg-primary-50/20 rounded-xl relative">
                                    <p className="font-black text-gray-900">{selectedAddress?.recipient_name || 'Sin nombre'}</p>
                                    <p className="text-sm text-gray-500 mt-1">
                                        {selectedAddress?.address} {selectedAddress?.number}
                                        {selectedAddress?.floor && `, ${selectedAddress.floor}${selectedAddress.apartment ? ` ${selectedAddress.apartment}` : ''}`}
                                    </p>
                                    <p className="text-sm text-gray-500">{selectedAddress?.city}, {selectedAddress?.state}</p>
                                    <p className="text-xs text-primary-600 font-bold uppercase mt-2">Envío Express Gratis</p>

                                    <button
                                        onClick={() => navigate('/profile')}
                                        className="text-[10px] font-bold text-gray-400 uppercase hover:text-primary-600 absolute top-4 right-4"
                                    >
                                        Cambiar
                                    </button>
                                </div>
                            ) : (
                                <div className="p-8 text-center border-2 border-dashed border-gray-200 rounded-xl bg-gray-50">
                                    <p className="text-gray-500 mb-4 font-bold uppercase text-xs">No tienes direcciones guardadas</p>
                                    <Button size="sm" onClick={() => navigate('/profile')}>Agregar dirección</Button>
                                </div>
                            )}
                        </Card>

                        <Card className="p-6">
                            <div className="flex items-center gap-3 mb-6">
                                <CreditCard className="w-6 h-6 text-primary-600" />
                                <h2 className="text-lg font-black uppercase tracking-tight">Método de Pago</h2>
                            </div>
                            <div className="flex items-center justify-between p-4 border border-gray-100 rounded-xl bg-gray-50">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 bg-white rounded-lg border border-gray-100 flex items-center justify-center p-2">
                                        <img src="https://logodownload.org/wp-content/uploads/2019/06/mercado-pago-logo.png" alt="Mercado Pago" className="w-full object-contain" />
                                    </div>
                                    <div>
                                        <p className="font-black text-gray-900">Mercado Pago</p>
                                        <p className="text-xs text-gray-500 font-bold uppercase">Paga de forma segura</p>
                                    </div>
                                </div>
                                <div className="w-5 h-5 rounded-full border-4 border-primary-600 bg-white"></div>
                            </div>
                        </Card>

                        <Card className="p-6">
                            <div className="flex items-center gap-3 mb-6">
                                <ShoppingBag className="w-6 h-6 text-primary-600" />
                                <h2 className="text-lg font-black uppercase tracking-tight">Resumen de Productos</h2>
                            </div>
                            <div className="space-y-4">
                                {items.map((item) => (
                                    <div key={item.id} className="flex justify-between items-center py-2 border-b border-gray-50 last:border-0">
                                        <div className="flex items-center gap-3">
                                            <span className="w-6 h-6 flex items-center justify-center bg-gray-100 rounded font-black text-xs">{item.quantity}x</span>
                                            <span className="text-sm font-bold text-gray-700">{item.product?.name}</span>
                                        </div>
                                        <PriceFormatter price={item.price * item.quantity} className="text-sm font-black" />
                                    </div>
                                ))}
                            </div>
                        </Card>
                    </div>

                    <div className="lg:col-span-1">
                        <Card className="p-6 sticky top-24 border-2 border-primary-600 shadow-xl shadow-primary-50">
                            <h2 className="text-sm font-black text-gray-900 uppercase tracking-widest mb-6 px-1 border-l-4 border-primary-500">Total a Pagar</h2>
                            <div className="space-y-2 mb-6">
                                <div className="flex justify-between items-center bg-primary-600 p-4 rounded-xl text-white">
                                    <span className="text-sm font-bold opacity-80 uppercase tracking-widest">Monto Total</span>
                                    <PriceFormatter price={totalAmount} className="text-2xl font-black" />
                                </div>
                            </div>
                            <Button
                                onClick={handleCheckout}
                                className="w-full py-6 text-lg font-black uppercase italic tracking-tighter"
                                loading={loading}
                            >
                                Pagar Ahora
                            </Button>
                            <p className="text-[10px] text-center text-gray-400 font-bold mt-4 uppercase">
                                Transacción segura encriptada con SSL
                            </p>
                        </Card>
                    </div>
                </div>
            </div>
        </Layout>
    );
}
