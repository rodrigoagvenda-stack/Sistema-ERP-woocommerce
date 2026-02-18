import { Routes, Route, Navigate } from 'react-router-dom'
import ProtectedRoute from '@/components/layout/ProtectedRoute'
import AdminLayout from '@/components/layout/AdminLayout'

// Public
import Login from '@/pages/Login'

// Admin pages
import Dashboard from '@/pages/admin/Dashboard'
import Products from '@/pages/admin/Products'
import Categories from '@/pages/admin/Categories'
import Brands from '@/pages/admin/Brands'
import Tags from '@/pages/admin/Tags'
import Attributes from '@/pages/admin/Attributes'
import Reviews from '@/pages/admin/Reviews'
import WooSettings from '@/pages/admin/WooSettings'
import SyncLogs from '@/pages/admin/SyncLogs'

// Analytics
import AnalyticsOverview from '@/pages/admin/analytics/Overview'
import AnalyticsProducts from '@/pages/admin/analytics/ProductsAnalytics'
import AnalyticsRevenue from '@/pages/admin/analytics/Revenue'
import AnalyticsOrders from '@/pages/admin/analytics/Orders'
import AnalyticsVariations from '@/pages/admin/analytics/Variations'
import AnalyticsCategories from '@/pages/admin/analytics/CategoriesAnalytics'
import AnalyticsStock from '@/pages/admin/analytics/Stock'
import AnalyticsSettings from '@/pages/admin/analytics/AnalyticsSettings'

function AdminPage({ children }) {
  return (
    <ProtectedRoute>
      <AdminLayout>{children}</AdminLayout>
    </ProtectedRoute>
  )
}

export default function App() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/login" element={<Login />} />

      {/* Admin */}
      <Route path="/admin/dashboard" element={<AdminPage><Dashboard /></AdminPage>} />
      <Route path="/admin/products" element={<AdminPage><Products /></AdminPage>} />
      <Route path="/admin/categories" element={<AdminPage><Categories /></AdminPage>} />
      <Route path="/admin/brands" element={<AdminPage><Brands /></AdminPage>} />
      <Route path="/admin/tags" element={<AdminPage><Tags /></AdminPage>} />
      <Route path="/admin/attributes" element={<AdminPage><Attributes /></AdminPage>} />
      <Route path="/admin/reviews" element={<AdminPage><Reviews /></AdminPage>} />
      <Route path="/admin/woo/settings" element={<AdminPage><WooSettings /></AdminPage>} />
      <Route path="/admin/woo/logs" element={<AdminPage><SyncLogs /></AdminPage>} />

      {/* Analytics */}
      <Route path="/admin/analytics/overview" element={<AdminPage><AnalyticsOverview /></AdminPage>} />
      <Route path="/admin/analytics/products" element={<AdminPage><AnalyticsProducts /></AdminPage>} />
      <Route path="/admin/analytics/revenue" element={<AdminPage><AnalyticsRevenue /></AdminPage>} />
      <Route path="/admin/analytics/orders" element={<AdminPage><AnalyticsOrders /></AdminPage>} />
      <Route path="/admin/analytics/variations" element={<AdminPage><AnalyticsVariations /></AdminPage>} />
      <Route path="/admin/analytics/categories" element={<AdminPage><AnalyticsCategories /></AdminPage>} />
      <Route path="/admin/analytics/stock" element={<AdminPage><AnalyticsStock /></AdminPage>} />
      <Route path="/admin/analytics/settings" element={<AdminPage><AnalyticsSettings /></AdminPage>} />

      {/* Redirects */}
      <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
      <Route path="/" element={<Navigate to="/admin/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
    </Routes>
  )
}
