import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, User, Search, Menu, X, Gavel, Store, Package, Bell, Shield, LayoutDashboard } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useCart } from '../../contexts/CartContext';
import { useQuery } from '@tanstack/react-query';
import { notificationService } from '../../services/api';
import { NotificationDropdown } from '../NotificationDropdown';

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { user, logout, isAuthenticated } = useAuth();
  const { totalItems } = useCart();
  const navigate = useNavigate();
  const dropdownRef = useRef(null);
  const notificationsRef = useRef(null);

  const { data: unreadData } = useQuery({
    queryKey: ['notifications', 'unread', 'count'],
    queryFn: () => notificationService.getUnread(),
    enabled: isAuthenticated,
    refetchInterval: 20000,
  });

  const unreadCount = unreadData?.data?.count || 0;

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(event.target)) {
        setIsNotificationsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery)}`);
      setSearchQuery('');
    }
  };

  return (
    <header className="sticky top-4 z-40 mx-auto w-[92%] sm:w-[95%] max-w-7xl glass rounded-2xl">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center space-x-1.5 sm:space-x-2 group">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg sm:rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
              <Gavel className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-lg sm:text-xl font-black text-gray-900 leading-none tracking-tighter">KEMAZON<span className="text-primary-600">.ar</span></span>
              <span className="text-[8px] sm:text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5 sm:mt-1">Marketplace AI</span>
            </div>
          </Link>

          <form onSubmit={handleSearch} className="hidden lg:flex flex-1 max-w-md mx-8">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar en Kemazon..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-100 bg-white/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all text-sm font-medium"
              />
            </div>
          </form>

          <nav className="hidden md:flex items-center space-x-1">
            <Link to="/auctions" className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-primary-600 hover:bg-white/50 rounded-xl transition-all font-bold text-sm">
              <Gavel className="w-4 h-4" />
              <span>Remates</span>
            </Link>
            <Link to="/products" className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-primary-600 hover:bg-white/50 rounded-xl transition-all font-bold text-sm">
              <Store className="w-4 h-4" />
              <span>Tienda</span>
            </Link>
            {isAuthenticated && (
              <Link to="/seller/dashboard" className="flex items-center space-x-2 px-4 py-2 text-primary-600 bg-primary-50 rounded-xl hover:bg-primary-100 transition-all font-bold text-sm">
                <LayoutDashboard className="w-4 h-4" />
                <span>Dashboard</span>
              </Link>
            )}
            {user?.is_admin && (
              <Link to="/admin/users" className="flex items-center space-x-2 px-4 py-2 text-tertiary-600 bg-tertiary-50 rounded-xl hover:bg-tertiary-100 transition-all font-bold text-sm">
                <Shield className="w-4 h-4" />
                <span>Admin</span>
              </Link>
            )}
          </nav>

          <div className="flex items-center space-x-2">
            {isAuthenticated ? (
              <>
                <div className="relative" ref={notificationsRef}>
                  <button
                    onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                    className={`relative p-2 rounded-xl transition-all ${isNotificationsOpen
                      ? 'text-primary-600 bg-primary-50'
                      : 'text-gray-500 hover:text-primary-600 hover:bg-white/50'
                      }`}
                  >
                    <Bell className="w-5 h-5" />
                    {unreadCount > 0 && (
                      <span className="absolute top-1 right-1 w-4 h-4 bg-primary-600 text-white text-[10px] font-black rounded-full flex items-center justify-center animate-pulse shadow-sm shadow-primary-200">
                        {unreadCount}
                      </span>
                    )}
                  </button>
                  <NotificationDropdown
                    isOpen={isNotificationsOpen}
                    onClose={() => setIsNotificationsOpen(false)}
                  />
                </div>
                <Link to="/cart" className="relative p-2 text-gray-500 hover:text-primary-600 hover:bg-white/50 rounded-xl transition-all">
                  <ShoppingCart className="w-5 h-5" />
                  {totalItems > 0 && (
                    <span className="absolute top-1 right-1 w-4 h-4 bg-primary-600 text-white text-[10px] font-black rounded-full flex items-center justify-center">
                      {totalItems}
                    </span>
                  )}
                </Link>
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="flex items-center space-x-3 p-1.5 pr-3 rounded-xl hover:bg-white/50 transition-all border border-transparent hover:border-white/50"
                  >
                    <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-tertiary-600 rounded-lg flex items-center justify-center text-white font-black text-sm shadow-sm overflow-hidden">
                      {user?.avatar ? (
                        <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                      ) : (
                        user?.name?.charAt(0).toUpperCase()
                      )}
                    </div>
                    <span className="hidden sm:block text-sm font-black text-gray-700">{user?.name}</span>
                  </button>
                  {isDropdownOpen && (
                    <div className="absolute right-0 mt-3 w-56 glass rounded-2xl shadow-2xl border border-white/40 py-2 animate-fade-in overflow-hidden">
                      <div className="px-4 py-3 border-b border-gray-100 mb-2">
                        <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">Bienvenido</p>
                        <p className="text-sm font-black text-gray-900 truncate">{user?.name}</p>
                      </div>
                      <Link to="/profile" className="block px-4 py-2 text-sm font-bold text-gray-700 hover:bg-primary-50 hover:text-primary-600 transition-colors">
                        Mi Perfil
                      </Link>
                      <Link to="/orders" className="block px-4 py-2 text-sm font-bold text-gray-700 hover:bg-primary-50 hover:text-primary-600 transition-colors">
                        Mis Pedidos
                      </Link>
                      <Link to="/seller/dashboard" className="block px-4 py-2 text-sm font-bold text-gray-700 hover:bg-primary-50 hover:text-primary-600 transition-colors">
                        Mi Tienda (Dashboard)
                      </Link>
                      {user?.is_admin && (
                        <Link to="/admin/users" className="block px-4 py-2 text-sm font-bold text-primary-600 hover:bg-primary-50 transition-colors">
                          <div className="flex items-center gap-2">
                            <Shield className="w-4 h-4" />
                            <span>Panel Admin</span>
                          </div>
                        </Link>
                      )}
                      <hr className="my-2 border-gray-100" />
                      <button
                        onClick={logout}
                        className="w-full text-left px-4 py-2 text-sm font-black text-red-600 hover:bg-red-50 transition-colors"
                      >
                        Cerrar Sesión
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="hidden sm:flex items-center gap-2">
                <Link to="/login" className="px-4 py-2 text-sm font-bold text-gray-600 hover:text-primary-600 transition-colors">
                  Ingresar
                </Link>
                <Link to="/register" className="btn-primary !py-2 !px-5 !text-sm">
                  Registrarse
                </Link>
              </div>
            )}

            <button
              className="md:hidden p-2 text-gray-600"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-100 animate-fade-in space-y-4">
            <form onSubmit={handleSearch}>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 bg-gray-50"
                />
              </div>
            </form>
            <nav className="flex flex-col space-y-2">
              <Link to="/auctions" className="px-4 py-3 rounded-xl font-bold text-gray-700 hover:bg-primary-50 hover:text-primary-600 transition-colors flex items-center gap-3">
                <Gavel className="w-4 h-4" /> Remates
              </Link>
              <Link to="/products" className="px-4 py-3 rounded-xl font-bold text-gray-700 hover:bg-primary-50 hover:text-primary-600 transition-colors flex items-center gap-3">
                <Store className="w-4 h-4" /> Tienda
              </Link>
              {!isAuthenticated && (
                <div className="grid grid-cols-2 gap-2 p-2 mt-4">
                  <Link to="/login" className="px-4 py-3 text-center rounded-xl font-bold text-gray-600 bg-gray-50 hover:bg-gray-100 transition-colors">
                    Ingresar
                  </Link>
                  <Link to="/register" className="px-4 py-3 text-center rounded-xl font-bold text-white bg-primary-600 hover:bg-primary-700 transition-colors">
                    Registrarse
                  </Link>
                </div>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}

export function Footer() {
  return (
    <footer className="bg-gray-950 text-gray-500 py-16 mt-20 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary-600 via-secondary-500 to-tertiary-600" />

      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 md:gap-12">
          <div className="space-y-6">
            <Link to="/" className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center rotate-3">
                <Gavel className="w-6 h-6 text-white -rotate-3" />
              </div>
              <span className="text-2xl font-black text-white tracking-tighter">KEMAZON<span className="text-primary-600">.ar</span></span>
            </Link>
            <p className="text-sm leading-relaxed">
              El marketplace más potente de Argentina. Remates en vivo, pagos seguros con MercadoPago y envíos a todo el país.
            </p>
          </div>

          <div>
            <h4 className="text-white font-black uppercase tracking-widest text-xs mb-6 px-1 border-l-4 border-primary-500">Ayuda</h4>
            <ul className="space-y-3 text-sm font-medium">
              <li><Link to="/help" className="hover:text-primary-400 transition-colors">Centro de Ayuda</Link></li>
              <li><Link to="/safety" className="hover:text-primary-400 transition-colors">Portal de Seguridad</Link></li>
              <li><Link to="/contact" className="hover:text-primary-400 transition-colors">Contactanos</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-black uppercase tracking-widest text-xs mb-6 px-1 border-l-4 border-tertiary-500">Legal</h4>
            <ul className="space-y-3 text-sm font-medium">
              <li><Link to="/terms" className="hover:text-tertiary-400 transition-colors">Términos del Servicio</Link></li>
              <li><Link to="/privacy" className="hover:text-tertiary-400 transition-colors">Privacidad de Datos</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/5 mt-10 sm:mt-12 pt-6 sm:pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs font-bold uppercase tracking-widest">
          <p className="text-center md:text-left">&copy; {new Date().getFullYear()} KEMAZON.ar. HECHO CON PASIÓN EN ARGENTINA.</p>
          <div className="flex flex-wrap justify-center gap-4 sm:gap-6">
            <span className="text-secondary-500">MERCADOPAGO</span>
            <span className="text-primary-500">CORREO ARGENTINO</span>
            <span className="text-tertiary-500">SEGURIDAD SSL</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

export function Layout({ children }) {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50/50 mesh-gradient relative">
      {/* Decorative Blobs */}
      <div className="fixed top-[-10%] left-[-5%] w-[40vw] h-[40vw] bg-primary-500/5 rounded-full blur-[120px] pointer-events-none -z-10" />
      <div className="fixed bottom-[-10%] right-[-5%] w-[40vw] h-[40vw] bg-secondary-500/5 rounded-full blur-[120px] pointer-events-none -z-10" />
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60vw] h-[60vw] bg-tertiary-500/5 rounded-full blur-[150px] pointer-events-none -z-10" />

      <Header />
      <main className="flex-1 mt-8 px-0">{children}</main>
      <Footer />
    </div>
  );
}
