import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { AuthProvider } from './contexts/AuthContext';
import { CartProvider } from './contexts/CartContext';
import { HomePage } from './pages/home/HomePage';
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';
import { ProductsPage } from './pages/product/ProductsPage';
import { ProductDetailPage } from './pages/product/ProductDetailPage';
import { AuctionsPage } from './pages/auction/AuctionsPage';
import { AuctionDetailPage } from './pages/auction/AuctionDetailPage';
import { SellerDashboard } from './pages/seller/SellerDashboard';
import { ProductFormPage } from './pages/seller/ProductFormPage';
import { AuctionFormPage } from './pages/seller/AuctionFormPage';
import { MyProductsPage } from './pages/seller/MyProductsPage';
import { SellerOrdersPage } from './pages/seller/SellerOrdersPage';
import { BecomeSellerPage } from './pages/seller/BecomeSellerPage';
import { ProfilePage } from './pages/profile/ProfilePage';
import { AdminUsersPage } from './pages/admin/AdminUsersPage';
import { CartPage } from './pages/cart/CartPage';
import { CheckoutPage } from './pages/checkout/CheckoutPage';
import NotificationsPage from './pages/notifications/NotificationsPage';
import { ProtectedRoute } from './components/ProtectedRoute';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <HashRouter>
        <AuthProvider>
          <CartProvider>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<HomePage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/products" element={<ProductsPage />} />
              <Route path="/products/:slug" element={<ProductDetailPage />} />
              <Route path="/auctions" element={<AuctionsPage />} />
              <Route path="/auctions/:slug" element={<AuctionDetailPage />} />

              {/* Private Profile & Seller Routes */}
              <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
              <Route path="/notifications" element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} />
              <Route path="/become-seller" element={<ProtectedRoute><BecomeSellerPage /></ProtectedRoute>} />
              <Route path="/cart" element={<ProtectedRoute><CartPage /></ProtectedRoute>} />
              <Route path="/checkout" element={<ProtectedRoute><CheckoutPage /></ProtectedRoute>} />

              <Route path="/seller/dashboard" element={<ProtectedRoute><SellerDashboard /></ProtectedRoute>} />
              <Route path="/seller/products" element={<ProtectedRoute><MyProductsPage /></ProtectedRoute>} />
              <Route path="/seller/products/create" element={<ProtectedRoute><ProductFormPage /></ProtectedRoute>} />
              <Route path="/seller/products/:id" element={<ProtectedRoute><ProductFormPage /></ProtectedRoute>} />
              <Route path="/seller/auctions/create" element={<ProtectedRoute><AuctionFormPage /></ProtectedRoute>} />
              <Route path="/seller/orders" element={<ProtectedRoute><SellerOrdersPage /></ProtectedRoute>} />

              {/* Admin Routes */}
              <Route path="/admin/users" element={<ProtectedRoute adminOnly><AdminUsersPage /></ProtectedRoute>} />

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
            <Toaster
              position="top-right"
              closeButton
              toastOptions={{
                style: {
                  background: '#fff',
                  color: '#374151',
                  border: '1px solid #e5e7eb',
                },
              }}
            />
          </CartProvider>
        </AuthProvider>
      </HashRouter>
    </QueryClientProvider>
  );
}

export default App;
