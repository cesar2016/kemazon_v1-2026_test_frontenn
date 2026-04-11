import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, User, Phone } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { Button, Input } from '../../components/ui';
import { toast } from 'sonner';

export function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (password !== passwordConfirmation) {
      toast.error('Las contraseñas no coinciden');
      return;
    }

    setLoading(true);

    try {
      await register({ name, email, phone, password, password_confirmation: passwordConfirmation });
      toast.success('Cuenta creada exitosamente');
      navigate('/');
    } catch (error) {
      const message = error.response?.data?.errors 
        ? Object.values(error.response.data.errors).flat().join(', ')
        : 'Error al registrar';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-secondary-50 py-8 px-3 sm:px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-6 sm:mb-8">
          <Link to="/" className="inline-flex items-center space-x-2 mb-4 sm:mb-6">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-primary-500 to-secondary-600 rounded-xl flex items-center justify-center">
              <span className="text-white text-lg sm:text-xl font-bold">K</span>
            </div>
            <span className="text-2xl sm:text-3xl font-bold gradient-text">KEMAZON</span>
          </Link>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Crear Cuenta</h1>
          <p className="text-gray-500 mt-1 sm:mt-2 text-sm">Únete a la comunidad de KEMAZON</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-xl p-5 sm:p-8">
          <div className="space-y-4 sm:space-y-5">
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                type="text"
                placeholder="Nombre completo"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="pl-12"
                required
              />
            </div>

            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-12"
                required
              />
            </div>

            <div className="relative">
              <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                type="tel"
                placeholder="Teléfono (opcional)"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="pl-12"
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                type={showPassword ? 'text' : 'password'}
                placeholder="Contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-12 pr-12"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>

            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                type={showPassword ? 'text' : 'password'}
                placeholder="Confirmar contraseña"
                value={passwordConfirmation}
                onChange={(e) => setPasswordConfirmation(e.target.value)}
                className="pl-12"
                required
              />
            </div>

            <p className="text-xs text-gray-500">
              Mínimo 8 caracteres, debe incluir números y letras.
            </p>

            <div className="flex items-start">
              <input type="checkbox" className="rounded border-gray-300 text-primary-600 focus:ring-primary-500 mt-1 flex-shrink-0" required />
              <span className="ml-2 text-xs sm:text-sm text-gray-600">
                Acepto los{' '}
                <Link to="/terms" className="text-primary-600 hover:underline">Términos</Link>
                {' '}y la{' '}
                <Link to="/privacy" className="text-primary-600 hover:underline">Política</Link>
              </span>
            </div>

            <Button type="submit" className="w-full" loading={loading}>
              Crear Cuenta
            </Button>
          </div>

          <div className="mt-6 text-center text-sm text-gray-500">
            ¿Ya tienes cuenta?{' '}
            <Link to="/login" className="text-primary-600 hover:text-primary-700 font-medium">
              Inicia sesión
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
