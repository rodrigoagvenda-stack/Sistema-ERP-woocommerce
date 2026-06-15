import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import ProtectedRoute from '@/components/layout/ProtectedRoute'
import SuperAdminRoute from '@/components/layout/SuperAdminRoute'
import AdminLayout from '@/components/layout/AdminLayout'
import SuperAdminLayout from '@/components/layout/SuperAdminLayout'

// Public
const Login = lazy(() => import('@/pages/Login'))

// Super Admin
const SuperAdminLogin         = lazy(() => import('@/pages/super-admin/Login'))
const SuperAdminCompanies     = lazy(() => import('@/pages/super-admin/Companies'))
const SuperAdminCompanyEditor = lazy(() => import('@/pages/super-admin/CompanyEditor'))

// Admin pages
const Dashboard      = lazy(() => import('@/pages/admin/Dashboard'))
const Products       = lazy(() => import('@/pages/admin/Products'))
const Categories     = lazy(() => import('@/pages/admin/Categories'))
const Brands         = lazy(() => import('@/pages/admin/Brands'))
const Tags           = lazy(() => import('@/pages/admin/Tags'))
const Styles         = lazy(() => import('@/pages/admin/Styles'))
const Attributes     = lazy(() => import('@/pages/admin/Attributes'))
const Reviews        = lazy(() => import('@/pages/admin/Reviews'))
const WooSettings    = lazy(() => import('@/pages/admin/WooSettings'))
const WooPayments    = lazy(() => import('@/pages/admin/WooPayments'))
const WooShipping    = lazy(() => import('@/pages/admin/WooShipping'))
const SyncLogs       = lazy(() => import('@/pages/admin/SyncLogs'))
const Coupons        = lazy(() => import('@/pages/admin/Coupons'))
const NossasCervejas = lazy(() => import('@/pages/admin/NossasCervejas'))
const FAQ            = lazy(() => import('@/pages/admin/FAQ'))
const Integrations   = lazy(() => import('@/pages/admin/Integrations'))
const Kits           = lazy(() => import('@/pages/admin/Kits'))

// Analytics
const AnalyticsOverview    = lazy(() => import('@/pages/admin/analytics/Overview'))
const AnalyticsProducts    = lazy(() => import('@/pages/admin/analytics/ProductsAnalytics'))
const AnalyticsRevenue     = lazy(() => import('@/pages/admin/analytics/Revenue'))
const AnalyticsOrders      = lazy(() => import('@/pages/admin/analytics/Orders'))
const AnalyticsVariations  = lazy(() => import('@/pages/admin/analytics/Variations'))
const AnalyticsCategories  = lazy(() => import('@/pages/admin/analytics/CategoriesAnalytics'))
const AnalyticsStock       = lazy(() => import('@/pages/admin/analytics/Stock'))
const AnalyticsSettings    = lazy(() => import('@/pages/admin/analytics/AnalyticsSettings'))

function AdminPage({ children }) {
  return (
    <ProtectedRoute>
      <AdminLayout>{children}</AdminLayout>
    </ProtectedRoute>
  )
}

function SuperPage({ children }) {
  return (
    <SuperAdminRoute>
      <SuperAdminLayout>{children}</SuperAdminLayout>
    </SuperAdminRoute>
  )
}

export default function App() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-screen text-gray-400">Carregando...</div>}>
      <Routes>
        {/* Login por empresa */}
        <Route path="/login/:slug" element={<Login />} />

        {/* Super Admin */}
        <Route path="/super-admin/login"         element={<SuperAdminLogin />} />
        <Route path="/super-admin/companies"     element={<SuperPage><SuperAdminCompanies /></SuperPage>} />
        <Route path="/super-admin/companies/new" element={<SuperPage><SuperAdminCompanyEditor /></SuperPage>} />
        <Route path="/super-admin/companies/:id" element={<SuperPage><SuperAdminCompanyEditor /></SuperPage>} />
        <Route path="/super-admin"               element={<Navigate to="/super-admin/login" replace />} />

        {/* Admin — Geral */}
        <Route path="/admin/:slug/dashboard"  element={<AdminPage><Dashboard /></AdminPage>} />
        <Route path="/admin/:slug/products"   element={<AdminPage><Products /></AdminPage>} />
        <Route path="/admin/:slug/categories" element={<AdminPage><Categories /></AdminPage>} />
        <Route path="/admin/:slug/brands"     element={<AdminPage><Brands /></AdminPage>} />
        <Route path="/admin/:slug/tags"       element={<AdminPage><Tags /></AdminPage>} />
        <Route path="/admin/:slug/styles"     element={<AdminPage><Styles /></AdminPage>} />
        <Route path="/admin/:slug/attributes" element={<AdminPage><Attributes /></AdminPage>} />
        <Route path="/admin/:slug/reviews"    element={<AdminPage><Reviews /></AdminPage>} />
        <Route path="/admin/:slug/faq"        element={<AdminPage><FAQ /></AdminPage>} />

        {/* Admin — WooCommerce */}
        <Route path="/admin/:slug/woo/settings" element={<AdminPage><WooSettings /></AdminPage>} />
        <Route path="/admin/:slug/woo/payments" element={<AdminPage><WooPayments /></AdminPage>} />
        <Route path="/admin/:slug/woo/shipping" element={<AdminPage><WooShipping /></AdminPage>} />
        <Route path="/admin/:slug/woo/logs"     element={<AdminPage><SyncLogs /></AdminPage>} />

        {/* Admin — Features opcionais */}
        <Route path="/admin/:slug/coupons"         element={<AdminPage><Coupons /></AdminPage>} />
        <Route path="/admin/:slug/nossas-cervejas" element={<AdminPage><NossasCervejas /></AdminPage>} />
        <Route path="/admin/:slug/integrations"    element={<AdminPage><Integrations /></AdminPage>} />
        <Route path="/admin/:slug/kits"            element={<AdminPage><Kits /></AdminPage>} />

        {/* Admin — Analytics */}
        <Route path="/admin/:slug/analytics/overview"   element={<AdminPage><AnalyticsOverview /></AdminPage>} />
        <Route path="/admin/:slug/analytics/products"   element={<AdminPage><AnalyticsProducts /></AdminPage>} />
        <Route path="/admin/:slug/analytics/revenue"    element={<AdminPage><AnalyticsRevenue /></AdminPage>} />
        <Route path="/admin/:slug/analytics/orders"     element={<AdminPage><AnalyticsOrders /></AdminPage>} />
        <Route path="/admin/:slug/analytics/variations" element={<AdminPage><AnalyticsVariations /></AdminPage>} />
        <Route path="/admin/:slug/analytics/categories" element={<AdminPage><AnalyticsCategories /></AdminPage>} />
        <Route path="/admin/:slug/analytics/stock"      element={<AdminPage><AnalyticsStock /></AdminPage>} />
        <Route path="/admin/:slug/analytics/settings"   element={<AdminPage><AnalyticsSettings /></AdminPage>} />

        {/* Redirects */}
        <Route path="/admin/:slug" element={<Navigate to="dashboard" replace />} />
        <Route path="/" element={<Navigate to={`/login/${localStorage.getItem('lastSlug') || 'agro'}`} replace />} />
        <Route path="*" element={<Navigate to={`/login/${localStorage.getItem('lastSlug') || 'agro'}`} replace />} />
      </Routes>
    </Suspense>
  )
}
