import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Store, Phone, CheckCircle, ArrowRight } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { Button, Card, Input } from '../../components/ui';
import { Layout } from '../../components/layout';
import { toast } from 'sonner';

export function BecomeSellerPage() {
  const { becomeSeller, user } = useAuth();
  const navigate = useNavigate();
  const [phone, setPhone] = useState(user?.phone || '');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await becomeSeller(phone);
      toast.success('¡Ahora eres vendedor!');
      navigate('/seller/dashboard');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error al activar cuenta de vendedor');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-2xl mx-auto py-16 px-4">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Store className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Conviértete en Vendedor</h1>
          <p className="text-gray-600">
            Llega a miles de compradores en Argentina. Publica tus productos y participa en subastas.
          </p>
        </div>

        <Card className="p-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Beneficios de ser vendedor</h2>
          <div className="space-y-4 mb-8">
            {[
              'Publica productos sin límite',
              'Crea subastas y llega a más compradores',
              'Gestiona tus pedidos desde un panel dedicado',
              'Acceso a estadísticas y reportes de ventas',
              'Pagos directos a tu cuenta',
            ].map((benefit, index) => (
              <div key={index} className="flex items-center space-x-3">
                <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                <span className="text-gray-700">{benefit}</span>
              </div>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="label">
                <Phone className="w-4 h-4 inline mr-2" />
                Teléfono de contacto
              </label>
              <Input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+54 11 1234 5678"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Los compradores podrán contactarte por este número
              </p>
            </div>

            <Button type="submit" className="w-full btn-primary" loading={loading}>
              Activar Cuenta de Vendedor <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </form>
        </Card>

        <div className="mt-8 text-center text-sm text-gray-500">
          Al convertirte en vendedor, aceptas nuestros{' '}
          <a href="/terms" className="text-primary-600 hover:underline">Términos y Condiciones</a>
          {' '}y{' '}
          <a href="/seller-policy" className="text-primary-600 hover:underline">Política para Vendedores</a>
        </div>
      </div>
    </Layout>
  );
}
