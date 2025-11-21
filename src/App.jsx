import React, { useState, useEffect } from 'react';
import { LayoutDashboard, Package, ShoppingBag, Menu, X, TrendingUp, DollarSign, Plus, Edit2, Trash2, Save, ArrowLeft, Eye, Upload, LogOut, Lock, Home, ChevronRight, ShoppingCart, MessageCircle, Minus, Tag, Copy, Check, Moon, Sun, Sparkles, Flame } from 'lucide-react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { ENV } from './config/env';
import { supabase, signIn, signUp, signOut, getCurrentUser, isAdmin } from './lib/supabase';
import Banner from './components/Banner';
import { ProductBadge, ProductPrice } from './components/ProductBadge';
import RelatedProducts from './components/RelatedProducts';
import MarketplaceSettings from './components/MarketplaceSettings';
import ProductMarketplaces from './components/ProductMarketplaces';
import MarketplaceSyncLogs from './components/MarketplaceSyncLogs';

const SUPABASE_URL = ENV.SUPABASE_URL;
const SUPABASE_ANON_KEY = ENV.SUPABASE_ANON_KEY;

const supabaseAPI = {
  headers: {
    'apikey': SUPABASE_ANON_KEY,
    'Authorization': 'Bearer ' + SUPABASE_ANON_KEY,
    'Content-Type': 'application/json',
    'Prefer': 'return=representation'
  },

  async getProducts() {
    const response = await fetch(SUPABASE_URL + '/rest/v1/products?order=created_at.desc&status=eq.active', {
      headers: this.headers
    });
    return response.json();
  },

  async getProductById(id) {
    const response = await fetch(SUPABASE_URL + '/rest/v1/products?id=eq.' + id, {
      headers: this.headers
    });
    const data = await response.json();
    return data[0];
  },

  async getAllProducts() {
    const response = await fetch(SUPABASE_URL + '/rest/v1/products?order=created_at.desc', {
      headers: this.headers
    });
    return response.json();
  },

  async getCategories() {
    const response = await fetch(SUPABASE_URL + '/rest/v1/categories?status=eq.active&select=id,name', {
      headers: this.headers
    });
    return response.json();
  },

  async getAllCategories() {
    const response = await fetch(SUPABASE_URL + '/rest/v1/categories?order=created_at.desc', {
      headers: this.headers
    });
    return response.json();
  },

  async createProduct(product) {
    const response = await fetch(SUPABASE_URL + '/rest/v1/products', {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify(product)
    });
    return response.json();
  },

  async updateProduct(id, product) {
    const response = await fetch(SUPABASE_URL + '/rest/v1/products?id=eq.' + id, {
      method: 'PATCH',
      headers: this.headers,
      body: JSON.stringify(product)
    });
    return response.json();
  },

  async deleteProduct(id) {
    const response = await fetch(SUPABASE_URL + '/rest/v1/products?id=eq.' + id, {
      method: 'DELETE',
      headers: this.headers
    });
    return response.ok;
  },

  async createCategory(category) {
    const response = await fetch(SUPABASE_URL + '/rest/v1/categories', {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify(category)
    });
    return response.json();
  },

  async updateCategory(id, category) {
    const response = await fetch(SUPABASE_URL + '/rest/v1/categories?id=eq.' + id, {
      method: 'PATCH',
      headers: this.headers,
      body: JSON.stringify(category)
    });
    return response.json();
  },

  async deleteCategory(id) {
    const response = await fetch(SUPABASE_URL + '/rest/v1/categories?id=eq.' + id, {
      method: 'DELETE',
      headers: this.headers
    });
    return response.ok;
  },

  async incrementViews(id, currentViews) {
    await this.updateProduct(id, { views: currentViews + 1 });
  },

  // Banner APIs
  async getBanners() {
    const response = await fetch(SUPABASE_URL + '/rest/v1/banners?order=order_index.asc', {
      headers: this.headers
    });
    return response.json();
  },

  async getActiveBanner() {
    const response = await fetch(SUPABASE_URL + '/rest/v1/banners?is_active=eq.true&order=order_index.asc&limit=1', {
      headers: this.headers
    });
    const data = await response.json();
    return data[0] || null;
  },

  async createBanner(banner) {
    const response = await fetch(SUPABASE_URL + '/rest/v1/banners', {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify(banner)
    });
    return response.json();
  },

  async updateBanner(id, banner) {
    const response = await fetch(SUPABASE_URL + '/rest/v1/banners?id=eq.' + id, {
      method: 'PATCH',
      headers: this.headers,
      body: JSON.stringify(banner)
    });
    return response.json();
  },

  async deleteBanner(id) {
    const response = await fetch(SUPABASE_URL + '/rest/v1/banners?id=eq.' + id, {
      method: 'DELETE',
      headers: this.headers
    });
    return response.ok;
  },

  // Settings API
  async getSettings() {
    const response = await fetch(SUPABASE_URL + '/rest/v1/settings?limit=1', {
      headers: this.headers
    });
    const data = await response.json();
    return data[0] || null;
  },

  async updateSettings(settings) {
    // Primeiro tenta atualizar
    const response = await fetch(SUPABASE_URL + '/rest/v1/settings?id=eq.1', {
      method: 'PATCH',
      headers: this.headers,
      body: JSON.stringify(settings)
    });

    // Se não existir, cria
    if (!response.ok) {
      const createResponse = await fetch(SUPABASE_URL + '/rest/v1/settings', {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify({ id: 1, ...settings })
      });
      return createResponse.json();
    }

    return response.json();
  }
};

export default function LukayaGriffeERP() {
  const [mode, setMode] = useState('catalog');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [cart, setCart] = useState([]);
  const [showCart, setShowCart] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [user, setUser] = useState(null);
  const [banners, setBanners] = useState([]);
  const [darkMode, setDarkMode] = useState(false);
  const [activeBanner, setActiveBanner] = useState({
    id: 1,
    title: 'Coleção Verão 2025',
    description: 'Novas peças exclusivas chegando! Aproveite os lançamentos com até 30% OFF',
    image_url: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1920&h=600&fit=crop',
    image_url_mobile: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&h=800&fit=crop',
    button_text: 'Ver Coleção',
    link_url: '#',
    is_active: true
  });

  // Verificar sessão do Supabase ao carregar
  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();

        if (session?.user) {
          setUser(session.user);
          setIsAuthenticated(true);
          setUserEmail(session.user.email);
        }

        // Carregar carrinho do localStorage
        const savedCart = localStorage.getItem('lukaya_cart');
        if (savedCart) {
          setCart(JSON.parse(savedCart));
        }
      } catch (error) {
        console.error('Erro ao verificar sessão:', error);
      } finally {
        setLoading(false);
      }
    };

    checkSession();

    // Escutar mudanças de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(session.user);
        setIsAuthenticated(true);
        setUserEmail(session.user.email);
      } else {
        setUser(null);
        setIsAuthenticated(false);
        setUserEmail('');
        setMode('catalog');
      }
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (mode === 'admin' && isAuthenticated) {
      loadAllProducts();
      loadCategories();
      loadBanners();
    } else if (mode === 'catalog') {
      loadProducts();
      loadCategories();
      loadBanners();
    }
    loadSettings(); // Carregar settings em ambos os modos
  }, [isAuthenticated, mode]);

  useEffect(() => {
    localStorage.setItem('lukaya_cart', JSON.stringify(cart));
  }, [cart]);

  const loadProducts = async () => {
    try {
      const data = await supabaseAPI.getProducts();
      setProducts(data || []);
    } catch (error) {
      console.error('Erro ao carregar produtos:', error);
    }
  };

  const loadAllProducts = async () => {
    try {
      const data = await supabaseAPI.getAllProducts();
      setProducts(data || []);
    } catch (error) {
      console.error('Erro ao carregar produtos:', error);
    }
  };

  const loadCategories = async () => {
    try {
      if (mode === 'admin' && isAuthenticated) {
        const data = await supabaseAPI.getAllCategories();
        setCategories(data || []);
      } else {
        const data = await supabaseAPI.getCategories();
        setCategories(data || []);
      }
    } catch (error) {
      console.error('Erro ao carregar categorias:', error);
    }
  };

  const loadBanners = async () => {
    try {
      if (mode === 'admin' && isAuthenticated) {
        const data = await supabaseAPI.getBanners();
        setBanners(data || []);
      } else {
        const banner = await supabaseAPI.getActiveBanner();
        // Se não encontrar banner no Supabase, mantém o banner fake
        if (banner) {
          setActiveBanner(banner);
        }
        // Se não encontrar, o banner fake inicial permanece
      }
    } catch (error) {
      console.error('Erro ao carregar banners:', error);
      // Em caso de erro, mantém o banner fake
    }
  };

  const loadSettings = async () => {
    try {
      const data = await supabaseAPI.getSettings();
      if (data && data.dark_mode !== undefined) {
        setDarkMode(data.dark_mode);
      }
    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
    }
  };

  const handleLogin = async (email, password) => {
    try {
      const data = await signIn(email, password);
      setUser(data.user);
      setIsAuthenticated(true);
      setUserEmail(data.user.email);
      return { success: true };
    } catch (error) {
      console.error('Erro no login:', error);
      return { success: false, error: error.message };
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
      setUser(null);
      setIsAuthenticated(false);
      setUserEmail('');
      setMode('catalog');
    } catch (error) {
      console.error('Erro no logout:', error);
    }
  };

  const addToCart = (product, size) => {
    const existingItem = cart.find(item => item.id === product.id && item.selectedSize === size);

    if (existingItem) {
      setCart(cart.map(item =>
        item.id === product.id && item.selectedSize === size
          ? Object.assign({}, item, { quantity: item.quantity + 1 })
          : item
      ));
    } else {
      setCart([].concat(cart, [Object.assign({}, product, { quantity: 1, selectedSize: size })]));
    }
  };

  const removeFromCart = (productId, size) => {
    setCart(cart.filter(item => !(item.id === productId && item.selectedSize === size)));
  };

  const updateQuantity = (productId, size, delta) => {
    setCart(cart.map(item => {
      if (item.id === productId && item.selectedSize === size) {
        const newQuantity = item.quantity + delta;
        return newQuantity > 0 ? Object.assign({}, item, { quantity: newQuantity }) : item;
      }
      return item;
    }).filter(item => item.quantity > 0));
  };

  const getCartTotal = () => {
    return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  };

  const sendWhatsAppOrder = () => {
    const items = cart.map(item =>
      '• ' + item.name + (item.selectedSize ? ' (Tam: ' + item.selectedSize + ')' : '') +
      '\n  Qtd: ' + item.quantity + ' x R$ ' + item.price.toFixed(2) + ' = R$ ' + (item.price * item.quantity).toFixed(2)
    ).join('\n\n');

    const message = '🛍️ *Pedido Lukaya Griffe*\n\n' + items + '\n\n💰 *Total: R$ ' + getCartTotal().toFixed(2) + '*';
    const whatsappNumber = ENV.WHATSAPP_NUMBER;
    const url = 'https://wa.me/' + whatsappNumber + '?text=' + encodeURIComponent(message);
    window.open(url, '_blank');
  };

  const formatCurrency = (value) => {
    const numbers = value.replace(/\D/g, '');
    const amount = parseFloat(numbers) / 100;
    return amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const parseCurrency = (value) => {
    const numbers = value.replace(/\D/g, '');
    return parseFloat(numbers) / 100;
  };

  const copyCatalogLink = () => {
    const link = window.location.origin + window.location.pathname;
    navigator.clipboard.writeText(link).then(() => {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    });
  };

  const LoginPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    // NOTA: Cadastro público removido por segurança
    // Novos admins devem ser criados manualmente via SQL no Supabase

    const handleSubmit = async (e) => {
      e.preventDefault();
      setError('');

      if (!email || !password) {
        setError('Preencha todos os campos');
        return;
      }

      if (password.length < 6) {
        setError('Senha deve ter no mínimo 6 caracteres');
        return;
      }

      setIsLoading(true);

      // Fazer login
      const result = await handleLogin(email, password);

      if (result.success) {
        setMode('admin');
      } else {
        setError(result.error || 'Erro ao fazer login. Verifique suas credenciais.');
      }

      setIsLoading(false);
    };

    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-400 via-yellow-500 to-orange-500 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
          <div className="text-center mb-8">
            <div className="inline-block p-4 bg-yellow-100 rounded-full mb-4">
              <Lock className="w-12 h-12 text-yellow-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Lukaya Griffe</h1>
            <p className="text-gray-600">Área Administrativa</p>
          </div>

          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                placeholder="seu@email.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Senha</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                placeholder="••••••••"
              />
            </div>

            <button
              onClick={handleSubmit}
              disabled={isLoading}
              className="w-full py-3 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Entrando...' : 'Entrar'}
            </button>

            <button
              onClick={() => setMode('catalog')}
              className="w-full py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              Ver Catálogo
            </button>
          </div>

          {/* Cadastro público removido por segurança */}
          {/* Novos administradores devem ser criados via SQL no Supabase */}
        </div>
      </div>
    );
  };

  const CatalogGrid = () => {
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [priceRange, setPriceRange] = useState('all');
    const [showFilters, setShowFilters] = useState(false);
    const [showSizeFilter, setShowSizeFilter] = useState(false);
    const [sizeFilterCategory, setSizeFilterCategory] = useState('');
    const [selectedSize, setSelectedSize] = useState('');
    const [searchTerm, setSearchTerm] = useState('');

    const getSizesForCategory = (categoryId) => {
      const category = categories.find(c => c.id === parseInt(categoryId));
      if (!category) return [];

      if (category.size_type === 'clothing') {
        return ['PP', 'P', 'M', 'G', 'GG', 'XG', 'XGG'];
      } else if (category.size_type === 'footwear') {
        return ['34/35', '36', '37', '38', '39', '40', '41', '42', '43', '44/45'];
      }
      return [];
    };

    const filteredProducts = products.filter(product => {
      // Busca por nome
      if (searchTerm && !product.name.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }

      // Filtro por tamanho (prioritário)
      if (selectedSize && sizeFilterCategory) {
        if (product.category_id !== parseInt(sizeFilterCategory)) return false;
        if (!product.available_sizes || !product.available_sizes.includes(selectedSize)) return false;
      }

      // Filtro por categoria normal
      if (selectedCategory !== 'all' && !selectedSize && product.category_id !== parseInt(selectedCategory)) {
        return false;
      }

      // Filtro por preço
      if (priceRange !== 'all') {
        const price = product.price;
        if (priceRange === '0-50' && (price < 0 || price > 50)) return false;
        if (priceRange === '50-100' && (price < 50 || price > 100)) return false;
        if (priceRange === '100-200' && (price < 100 || price > 200)) return false;
        if (priceRange === '200+' && price < 200) return false;
      }

      return true;
    });

    const handleClearSizeFilter = () => {
      setSizeFilterCategory('');
      setSelectedSize('');
      setShowSizeFilter(false);
    };

    const handleClearAllFilters = () => {
      setSelectedCategory('all');
      setPriceRange('all');
      setSizeFilterCategory('');
      setSelectedSize('');
      setSearchTerm('');
      setShowSizeFilter(false);
    };

    const categoriesWithSizes = categories.filter(cat => cat.size_type);
    const hasActiveFilters = selectedCategory !== 'all' || priceRange !== 'all' || selectedSize || searchTerm;

    return (
      <div className={`min-h-screen transition-colors duration-300 ${darkMode ? 'bg-[#111111]' : 'bg-gray-50'}`}>
        <header className={`shadow-sm sticky top-0 z-40 transition-colors duration-300 ${darkMode ? 'bg-[#202020]' : 'bg-white'}`}>
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between mb-4">
              <h1 className={`text-2xl font-bold ${darkMode ? 'text-yellow-400' : 'text-yellow-600'}`}>Lukaya Griffe</h1>
              <div className="flex items-center gap-2 sm:gap-4">
                <button
                  onClick={() => setDarkMode(!darkMode)}
                  className={`p-2 rounded-lg transition-colors ${darkMode ? 'hover:bg-[#333333] text-yellow-400' : 'hover:bg-gray-100 text-gray-700'}`}
                  title={darkMode ? 'Modo Claro' : 'Modo Escuro'}
                >
                  {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                </button>
                <button
                  onClick={() => setMode('admin')}
                  className={`px-3 py-2 text-xs sm:text-sm rounded-lg transition-colors ${darkMode ? 'text-white hover:text-yellow-400 hover:bg-[#333333]' : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'}`}
                >
                  Admin
                </button>
                <button
                  onClick={() => setShowCart(true)}
                  className={`relative p-2 rounded-lg transition-colors ${darkMode ? 'hover:bg-[#333333] text-yellow-400' : 'hover:bg-gray-100'}`}
                >
                  <ShoppingCart className="w-6 h-6" />
                  {cart.length > 0 && (
                    <span className="absolute -top-1 -right-1 bg-yellow-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                      {cart.length}
                    </span>
                  )}
                </button>
              </div>
            </div>

            {/* Barra de Busca e Filtros */}
            <div className="flex flex-col md:flex-row gap-3">
              <div className="flex-1 relative">
                <input
                  type="text"
                  placeholder="Buscar produtos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent ${darkMode ? 'bg-[#202020] border-gray-700 text-white placeholder-gray-400' : 'bg-white border-gray-300'}`}
                />
                <Package className={`absolute left-3 top-2.5 w-5 h-5 ${darkMode ? 'text-gray-400' : 'text-gray-400'}`} />
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setShowSizeFilter(!showSizeFilter)}
                  className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
                    showSizeFilter || selectedSize
                      ? 'bg-yellow-500 text-white shadow-md hover:bg-yellow-600'
                      : darkMode
                      ? 'bg-[#202020] text-yellow-400 border border-yellow-500/30 hover:bg-[#333333]'
                      : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <Tag className="w-4 h-4" />
                  <span className="hidden sm:inline">Filtrar por Tamanho</span>
                  <span className="sm:hidden">Tamanho</span>
                </button>

                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`md:hidden w-full px-4 py-3 rounded-lg flex items-center justify-center gap-2 font-medium transition-all ${
                    darkMode
                      ? 'bg-[#202020] border border-gray-700 text-white hover:bg-[#333333]'
                      : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Package className="w-5 h-5" />
                  Filtros {hasActiveFilters && <span className="px-2 py-0.5 bg-yellow-500 text-white text-xs rounded-full">{[selectedCategory !== 'all', priceRange !== 'all', searchTerm].filter(Boolean).length}</span>}
                </button>
              </div>
            </div>

            {/* Painel de Filtro por Tamanho */}
            {showSizeFilter && (
              <div className={`mt-4 p-5 rounded-xl border-2 transition-all ${
                darkMode
                  ? 'bg-[#202020] border-yellow-500/20'
                  : 'bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-300'
              }`}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className={`block text-sm font-semibold mb-2 flex items-center gap-2 ${
                      darkMode ? 'text-yellow-400' : 'text-gray-800'
                    }`}>
                      <Tag className="w-4 h-4" />
                      Categoria
                    </label>
                    <select
                      value={sizeFilterCategory}
                      onChange={(e) => {
                        setSizeFilterCategory(e.target.value);
                        setSelectedSize('');
                        setSelectedCategory('all');
                      }}
                      className={`w-full px-4 py-2.5 border-2 rounded-lg focus:ring-2 focus:ring-yellow-500 transition-all font-medium ${
                        darkMode
                          ? 'bg-[#111111] border-gray-700 text-white hover:border-yellow-500/50'
                          : 'bg-white border-gray-300 text-gray-800 hover:border-yellow-400'
                      }`}
                    >
                      <option value="">Selecione uma categoria</option>
                      {categoriesWithSizes.map(cat => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className={`block text-sm font-semibold mb-2 flex items-center gap-2 ${
                      darkMode ? 'text-yellow-400' : 'text-gray-800'
                    }`}>
                      <Package className="w-4 h-4" />
                      Tamanho
                    </label>
                    {sizeFilterCategory ? (
                      <div className="flex flex-wrap gap-2">
                        {getSizesForCategory(sizeFilterCategory).map(size => (
                          <button
                            key={size}
                            onClick={() => setSelectedSize(size)}
                            className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all transform hover:scale-105 ${
                              selectedSize === size
                                ? darkMode
                                  ? 'bg-yellow-400/90 text-gray-900 shadow-lg shadow-yellow-500/30'
                                  : 'bg-yellow-300 text-gray-900 shadow-lg shadow-yellow-500/30'
                                : darkMode
                                ? 'bg-yellow-500/80 text-white hover:bg-yellow-500 border-2 border-yellow-400/30'
                                : 'bg-yellow-500 text-white hover:bg-yellow-600 border-2 border-yellow-400'
                            }`}
                          >
                            {size}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <p className={`text-sm italic py-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        Selecione uma categoria primeiro
                      </p>
                    )}
                  </div>
                </div>

                {selectedSize && (
                  <div className={`mt-4 pt-4 border-t-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 ${
                    darkMode ? 'border-gray-700' : 'border-yellow-300'
                  }`}>
                    <span className={`text-sm flex items-center gap-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      <Check className="w-4 h-4 text-green-500" />
                      Filtrando: <strong className={darkMode ? 'text-yellow-400' : 'text-yellow-600'}>{categories.find(c => c.id === parseInt(sizeFilterCategory))?.name} - Tamanho {selectedSize}</strong>
                    </span>
                    <button
                      onClick={handleClearSizeFilter}
                      className={`px-4 py-1.5 rounded-lg font-medium text-sm transition-all ${
                        darkMode
                          ? 'text-yellow-400 hover:bg-[#333333]'
                          : 'text-yellow-700 hover:bg-yellow-200'
                      }`}
                    >
                      ✕ Limpar filtro
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </header>

        {/* Banner Hero */}
        {activeBanner && <Banner banner={activeBanner} darkMode={darkMode} />}

        <div className="max-w-7xl mx-auto px-4 py-6">
          {/* Breadcrumb de Filtros Ativos */}
          {hasActiveFilters && (
            <div className="mb-4 flex items-center gap-2 flex-wrap">
              <span className="text-sm text-gray-600">Filtros ativos:</span>
              {selectedSize && (
                <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm font-medium flex items-center gap-1">
                  Tamanho: {selectedSize}
                  <button onClick={handleClearSizeFilter} className="ml-1 hover:text-yellow-900">×</button>
                </span>
              )}
              {selectedCategory !== 'all' && !selectedSize && (
                <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium flex items-center gap-1">
                  {categories.find(c => c.id === parseInt(selectedCategory))?.name}
                  <button onClick={() => setSelectedCategory('all')} className="ml-1 hover:text-blue-900">×</button>
                </span>
              )}
              {priceRange !== 'all' && (
                <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium flex items-center gap-1">
                  Preço: {priceRange === '200+' ? 'Acima de R$ 200' : `R$ ${priceRange.replace('-', ' - ')}`}
                  <button onClick={() => setPriceRange('all')} className="ml-1 hover:text-green-900">×</button>
                </span>
              )}
              {searchTerm && (
                <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium flex items-center gap-1">
                  "{searchTerm}"
                  <button onClick={() => setSearchTerm('')} className="ml-1 hover:text-purple-900">×</button>
                </span>
              )}
              <button
                onClick={handleClearAllFilters}
                className="text-sm text-gray-600 hover:text-gray-800 underline"
              >
                Limpar tudo
              </button>
            </div>
          )}

          <div className="flex gap-6">
            {/* Sidebar de Filtros Tradicionais */}
            {!selectedSize && (
              <aside className={
                (showFilters ? `fixed inset-0 z-50 overflow-y-auto p-4 ${darkMode ? 'bg-[#111111]' : 'bg-white'}` : 'hidden') +
                ' md:relative md:block md:w-64 md:p-0 md:z-auto space-y-4'
              }>
                {/* Cabeçalho mobile com botão fechar */}
                <div className={`md:hidden flex items-center justify-between mb-4 pb-4 border-b sticky top-0 z-10 ${darkMode ? 'bg-[#111111] border-gray-700' : 'bg-white'}`}>
                  <h2 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>Filtros</h2>
                  <button
                    onClick={() => setShowFilters(false)}
                    className={`p-2 rounded-lg ${darkMode ? 'hover:bg-[#333333] text-white' : 'hover:bg-gray-100'}`}
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <div className={`${darkMode ? 'bg-gradient-to-br from-[#202020] to-[#1a1a1a]' : 'bg-gradient-to-br from-white to-gray-50'} rounded-xl shadow-md p-5 border-2 ${darkMode ? 'border-yellow-500/10' : 'border-gray-200'}`}>
                  <h3 className={`font-bold text-base mb-4 flex items-center gap-2 ${darkMode ? 'text-yellow-400' : 'text-gray-800'}`}>
                    <div className={`p-2 rounded-lg ${darkMode ? 'bg-yellow-500/10' : 'bg-yellow-100'}`}>
                      <Tag className="w-5 h-5" />
                    </div>
                    Categorias
                  </h3>
                  <div className="space-y-1.5">
                    <button
                      onClick={() => setSelectedCategory('all')}
                      className={`w-full flex items-center gap-3 cursor-pointer p-3 rounded-lg transition-all border-2 ${
                        selectedCategory === 'all'
                          ? darkMode
                            ? 'bg-yellow-500/20 border-yellow-500/50'
                            : 'bg-yellow-50 border-yellow-400'
                          : darkMode
                          ? 'border-transparent hover:bg-[#333333] hover:border-gray-700'
                          : 'border-transparent hover:bg-gray-100'
                      }`}
                    >
                      <span className={`text-sm font-medium ${
                        selectedCategory === 'all'
                          ? darkMode ? 'text-yellow-400' : 'text-yellow-700'
                          : darkMode ? 'text-gray-300' : 'text-gray-700'
                      }`}>Todas as categorias</span>
                    </button>
                    {categories.map(cat => (
                      <button
                        key={cat.id}
                        onClick={() => setSelectedCategory(String(cat.id))}
                        className={`w-full flex items-center gap-3 cursor-pointer p-3 rounded-lg transition-all border-2 ${
                          selectedCategory === String(cat.id)
                            ? darkMode
                              ? 'bg-yellow-500/20 border-yellow-500/50'
                              : 'bg-yellow-50 border-yellow-400'
                            : darkMode
                            ? 'border-transparent hover:bg-[#333333] hover:border-gray-700'
                            : 'border-transparent hover:bg-gray-100'
                        }`}
                      >
                        <span className={`text-sm font-medium ${
                          selectedCategory === String(cat.id)
                            ? darkMode ? 'text-yellow-400' : 'text-yellow-700'
                            : darkMode ? 'text-gray-300' : 'text-gray-700'
                        }`}>{cat.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className={`${darkMode ? 'bg-gradient-to-br from-[#202020] to-[#1a1a1a]' : 'bg-gradient-to-br from-white to-gray-50'} rounded-xl shadow-md p-5 border-2 ${darkMode ? 'border-yellow-500/10' : 'border-gray-200'}`}>
                  <h3 className={`font-bold text-base mb-4 flex items-center gap-2 ${darkMode ? 'text-yellow-400' : 'text-gray-800'}`}>
                    <div className={`p-2 rounded-lg ${darkMode ? 'bg-yellow-500/10' : 'bg-yellow-100'}`}>
                      <DollarSign className="w-5 h-5" />
                    </div>
                    Faixa de Preço
                  </h3>
                  <div className="space-y-1.5">
                    <button
                      onClick={() => setPriceRange('all')}
                      className={`w-full flex items-center gap-3 cursor-pointer p-3 rounded-lg transition-all border-2 ${
                        priceRange === 'all'
                          ? darkMode
                            ? 'bg-yellow-500/20 border-yellow-500/50'
                            : 'bg-yellow-50 border-yellow-400'
                          : darkMode
                          ? 'border-transparent hover:bg-[#333333] hover:border-gray-700'
                          : 'border-transparent hover:bg-gray-100'
                      }`}
                    >
                      <span className={`text-sm font-medium ${
                        priceRange === 'all'
                          ? darkMode ? 'text-yellow-400' : 'text-yellow-700'
                          : darkMode ? 'text-gray-300' : 'text-gray-700'
                      }`}>Todos os preços</span>
                    </button>
                    <button
                      onClick={() => setPriceRange('0-50')}
                      className={`w-full flex items-center gap-3 cursor-pointer p-3 rounded-lg transition-all border-2 ${
                        priceRange === '0-50'
                          ? darkMode
                            ? 'bg-yellow-500/20 border-yellow-500/50'
                            : 'bg-yellow-50 border-yellow-400'
                          : darkMode
                          ? 'border-transparent hover:bg-[#333333] hover:border-gray-700'
                          : 'border-transparent hover:bg-gray-100'
                      }`}
                    >
                      <span className={`text-sm font-medium ${
                        priceRange === '0-50'
                          ? darkMode ? 'text-yellow-400' : 'text-yellow-700'
                          : darkMode ? 'text-gray-300' : 'text-gray-700'
                      }`}>Até R$ 50</span>
                    </button>
                    <button
                      onClick={() => setPriceRange('50-100')}
                      className={`w-full flex items-center gap-3 cursor-pointer p-3 rounded-lg transition-all border-2 ${
                        priceRange === '50-100'
                          ? darkMode
                            ? 'bg-yellow-500/20 border-yellow-500/50'
                            : 'bg-yellow-50 border-yellow-400'
                          : darkMode
                          ? 'border-transparent hover:bg-[#333333] hover:border-gray-700'
                          : 'border-transparent hover:bg-gray-100'
                      }`}
                    >
                      <span className={`text-sm font-medium ${
                        priceRange === '50-100'
                          ? darkMode ? 'text-yellow-400' : 'text-yellow-700'
                          : darkMode ? 'text-gray-300' : 'text-gray-700'
                      }`}>R$ 50 - R$ 100</span>
                    </button>
                    <button
                      onClick={() => setPriceRange('100-200')}
                      className={`w-full flex items-center gap-3 cursor-pointer p-3 rounded-lg transition-all border-2 ${
                        priceRange === '100-200'
                          ? darkMode
                            ? 'bg-yellow-500/20 border-yellow-500/50'
                            : 'bg-yellow-50 border-yellow-400'
                          : darkMode
                          ? 'border-transparent hover:bg-[#333333] hover:border-gray-700'
                          : 'border-transparent hover:bg-gray-100'
                      }`}
                    >
                      <span className={`text-sm font-medium ${
                        priceRange === '100-200'
                          ? darkMode ? 'text-yellow-400' : 'text-yellow-700'
                          : darkMode ? 'text-gray-300' : 'text-gray-700'
                      }`}>R$ 100 - R$ 200</span>
                    </button>
                    <button
                      onClick={() => setPriceRange('200+')}
                      className={`w-full flex items-center gap-3 cursor-pointer p-3 rounded-lg transition-all border-2 ${
                        priceRange === '200+'
                          ? darkMode
                            ? 'bg-yellow-500/20 border-yellow-500/50'
                            : 'bg-yellow-50 border-yellow-400'
                          : darkMode
                          ? 'border-transparent hover:bg-[#333333] hover:border-gray-700'
                          : 'border-transparent hover:bg-gray-100'
                      }`}
                    >
                      <span className={`text-sm font-medium ${
                        priceRange === '200+'
                          ? darkMode ? 'text-yellow-400' : 'text-yellow-700'
                          : darkMode ? 'text-gray-300' : 'text-gray-700'
                      }`}>Acima de R$ 200</span>
                    </button>
                  </div>
                </div>
              </aside>
            )}

            {/* Grid de Produtos */}
            <div className="flex-1">
              <div className="flex items-center justify-between mb-4">
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  {filteredProducts.length} produto{filteredProducts.length !== 1 ? 's' : ''} encontrado{filteredProducts.length !== 1 ? 's' : ''}
                </p>
              </div>

              {filteredProducts.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {filteredProducts.map(product => (
                    <div
                      key={product.id}
                      onClick={() => setSelectedProductId(product.id)}
                      className={`${darkMode ? 'bg-[#202020]' : 'bg-white'} rounded-lg shadow-sm overflow-hidden cursor-pointer hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 group`}
                    >
                      <div className="aspect-square bg-gray-200 overflow-hidden relative">
                        <ProductBadge product={product} />
                        <img
                          src={product.image_urls || 'https://via.placeholder.com/400'}
                          alt={product.name}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                        />
                      </div>
                      <div className="p-4">
                        <p className={`text-sm sm:text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'} mb-1`}>
                          {categories.find(c => c.id === product.category_id)?.name || 'Sem categoria'}
                        </p>
                        <h3 className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-800'} mb-2 text-base sm:text-sm line-clamp-2 group-hover:text-yellow-400 transition-colors`}>{product.name}</h3>
                        {product.available_sizes && product.available_sizes.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-2">
                            {product.available_sizes.slice(0, 5).map(size => (
                              <span
                                key={size}
                                className={
                                  size === selectedSize
                                    ? "px-2 py-1 sm:py-0.5 bg-yellow-100 text-yellow-700 text-sm sm:text-xs rounded border border-yellow-300 font-medium"
                                    : `px-2 py-1 sm:py-0.5 text-sm sm:text-xs rounded ${darkMode ? 'bg-[#333333] text-gray-300' : 'bg-gray-100 text-gray-600'}`
                                }
                              >
                                {size}
                              </span>
                            ))}
                            {product.available_sizes.length > 5 && (
                              <span className={`px-2 py-1 sm:py-0.5 text-sm sm:text-xs rounded ${darkMode ? 'bg-[#333333] text-gray-300' : 'bg-gray-100 text-gray-600'}`}>
                                +{product.available_sizes.length - 5}
                              </span>
                            )}
                          </div>
                        )}
                        <ProductPrice product={product} darkMode={darkMode} />
                        <p className={`text-sm sm:text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'} mt-1`}>
                          ou 6x de R$ {(product.price / 6).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className={`text-center py-16 rounded-lg shadow-sm ${darkMode ? 'bg-[#202020]' : 'bg-white'}`}>
                  <ShoppingBag className={`w-16 h-16 mx-auto mb-4 ${darkMode ? 'text-gray-600' : 'text-gray-300'}`} />
                  <p className={`text-lg mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Nenhum produto encontrado</p>
                  <button
                    onClick={handleClearAllFilters}
                    className="mt-4 px-6 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600"
                  >
                    Ver Todos os Produtos
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const ProductDetail = () => {
    const [product, setProduct] = useState(null);
    const [selectedSize, setSelectedSize] = useState('38');
    const [quantity, setQuantity] = useState(1);
    const sizes = ['34/35', '36', '37', '38', '39', '40', '41', '42', '43', '44/45'];

    useEffect(() => {
      loadProduct();
    }, [selectedProductId]);

    const loadProduct = async () => {
      try {
        const data = await supabaseAPI.getProductById(selectedProductId);
        setProduct(data);
        if (data) {
          await supabaseAPI.incrementViews(selectedProductId, data.views || 0);
        }
      } catch (error) {
        console.error('Erro:', error);
      }
    };

    if (!product) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <Package className="w-12 h-12 text-gray-400 mx-auto mb-2 animate-pulse" />
            <p className="text-gray-600">Carregando...</p>
          </div>
        </div>
      );
    }

    const relatedProducts = products.filter(p => p.id !== product.id && p.category_id === product.category_id).slice(0, 4);

    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow-sm sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
            <button onClick={() => setSelectedProductId(null)} className="flex items-center gap-2 text-gray-600 hover:text-gray-800">
              <ArrowLeft className="w-5 h-5" />
              <span className="font-medium">Voltar</span>
            </button>
            <h1 className="text-2xl font-bold text-yellow-600">Lukaya Griffe</h1>
            <button
              onClick={() => setShowCart(true)}
              className="relative p-2 hover:bg-gray-100 rounded-lg"
            >
              <ShoppingCart className="w-6 h-6" />
              {cart.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-yellow-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                  {cart.length}
                </span>
              )}
            </button>
          </div>
        </header>

        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Home className="w-4 h-4" />
            <ChevronRight className="w-4 h-4" />
            <span>{categories.find(c => c.id === product.category_id) ? categories.find(c => c.id === product.category_id).name : 'Produtos'}</span>
            <ChevronRight className="w-4 h-4" />
            <span className="text-gray-900">{product.name}</span>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div>
              <div className="aspect-square bg-gray-200 rounded-xl overflow-hidden mb-4">
                <img
                  src={product.image_urls || 'https://via.placeholder.com/800'}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">{product.name}</h1>

              <div className="mb-6">
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl sm:text-4xl font-bold text-gray-900">R$ {product.price.toFixed(2)}</span>
                </div>
                <p className="text-sm sm:text-base text-gray-600 mt-1">ou 6x de R$ {(product.price / 6).toFixed(2)} sem juros</p>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  SELECIONE O TAMANHO
                </label>
                <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
                  {sizes.map(size => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={'py-3 px-4 border-2 rounded-lg font-medium transition-colors ' + (selectedSize === size ? 'border-yellow-500 bg-yellow-50 text-yellow-700' : 'border-gray-300 hover:border-gray-400')}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">QUANTIDADE</label>
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    <Minus className="w-5 h-5" />
                  </button>
                  <span className="text-xl font-medium w-12 text-center">{quantity}</span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="space-y-3 mb-8">
                <button
                  onClick={() => {
                    for (let i = 0; i < quantity; i++) {
                      addToCart(product, selectedSize);
                    }
                    alert('Produto adicionado ao carrinho!');
                  }}
                  className="w-full py-3 sm:py-4 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors font-medium text-base sm:text-lg"
                >
                  COMPRAR
                </button>
                <button
                  onClick={() => {
                    for (let i = 0; i < quantity; i++) {
                      addToCart(product, selectedSize);
                    }
                    setShowCart(true);
                  }}
                  className="w-full py-3 sm:py-4 border-2 border-yellow-500 text-yellow-600 rounded-lg hover:bg-yellow-50 transition-colors font-medium text-base sm:text-lg"
                >
                  ADICIONAR AO CARRINHO
                </button>
              </div>

              <div className="mb-8">
                <h2 className="text-lg font-bold text-gray-900 mb-3">DESCRIÇÃO</h2>
                <p className="text-gray-600 leading-relaxed">{product.description}</p>
              </div>
            </div>
          </div>

          {relatedProducts.length > 0 && (
            <div className="mt-16">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Você também pode gostar</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {relatedProducts.map(relProduct => (
                  <div
                    key={relProduct.id}
                    onClick={() => setSelectedProductId(relProduct.id)}
                    className="bg-white rounded-lg shadow-md overflow-hidden cursor-pointer hover:shadow-xl transition-shadow"
                  >
                    <div className="aspect-square bg-gray-200">
                      <img
                        src={relProduct.image_urls || 'https://via.placeholder.com/400'}
                        alt={relProduct.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold text-gray-800 text-sm mb-2">{relProduct.name}</h3>
                      <p className="text-lg font-bold text-yellow-600">
                        R$ {relProduct.price.toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const CartModal = () => {
    if (!showCart) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-2 sm:p-4">
        <div className={`${darkMode ? 'bg-[#202020]' : 'bg-white'} rounded-xl max-w-lg sm:max-w-2xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-hidden flex flex-col`}>
          <div className={`p-4 sm:p-6 border-b ${darkMode ? 'border-gray-700' : ''} flex items-center justify-between`}>
            <h2 className={`text-lg sm:text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Carrinho</h2>
            <button onClick={() => setShowCart(false)} className={`p-2 rounded-lg ${darkMode ? 'hover:bg-[#333333] text-white' : 'hover:bg-gray-100'}`}>
              <X className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-3 sm:p-6">
            {cart.length > 0 ? (
              <div className="space-y-3 sm:space-y-4">
                {cart.map((item, index) => (
                  <div key={item.id + '-' + (item.selectedSize || '') + '-' + index} className={`flex gap-3 p-3 sm:p-4 border rounded-lg ${darkMode ? 'border-gray-700' : ''}`}>
                    <img
                      src={item.image_urls || 'https://via.placeholder.com/100'}
                      alt={item.name}
                      className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <h3 className={`font-semibold text-sm sm:text-base truncate ${darkMode ? 'text-white' : 'text-gray-900'}`}>{item.name}</h3>
                      {item.selectedSize && (
                        <p className={`text-xs sm:text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Tam: {item.selectedSize}</p>
                      )}
                      <p className={`text-base sm:text-lg font-bold mt-1 ${darkMode ? 'text-yellow-400' : 'text-yellow-600'}`}>
                        R$ {item.price.toFixed(2)}
                      </p>
                      <div className="flex items-center gap-2 sm:gap-3 mt-2">
                        <button
                          onClick={() => updateQuantity(item.id, item.selectedSize, -1)}
                          className={`p-1.5 sm:p-2 border rounded ${darkMode ? 'border-gray-700 hover:bg-[#333333] text-white' : 'hover:bg-gray-50'}`}
                        >
                          <Minus className="w-3 h-3 sm:w-4 sm:h-4" />
                        </button>
                        <span className={`font-medium text-sm sm:text-base min-w-[20px] text-center ${darkMode ? 'text-white' : ''}`}>{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.id, item.selectedSize, 1)}
                          className={`p-1.5 sm:p-2 border rounded ${darkMode ? 'border-gray-700 hover:bg-[#333333] text-white' : 'hover:bg-gray-50'}`}
                        >
                          <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
                        </button>
                        <button
                          onClick={() => removeFromCart(item.id, item.selectedSize)}
                          className="text-red-500 text-xs sm:text-sm ml-auto hover:text-red-700"
                        >
                          Remover
                        </button>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className={`text-base sm:text-lg font-bold whitespace-nowrap ${darkMode ? 'text-yellow-400' : 'text-gray-900'}`}>
                        R$ {(item.price * item.quantity).toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <ShoppingCart className={`w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 ${darkMode ? 'text-gray-600' : 'text-gray-300'}`} />
                <p className={`text-sm sm:text-base ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Seu carrinho está vazio</p>
              </div>
            )}
          </div>

          {cart.length > 0 && (
            <div className={`p-4 sm:p-6 border-t ${darkMode ? 'border-gray-700 bg-[#202020]' : 'border-gray-200 bg-gray-50'}`}>
              <div className="flex justify-between items-center mb-3 sm:mb-4">
                <span className={`text-base sm:text-lg font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Total:</span>
                <span className={`text-2xl sm:text-3xl font-bold ${darkMode ? 'text-yellow-400' : 'text-gray-900'}`}>
                  R$ {getCartTotal().toFixed(2)}
                </span>
              </div>
              <button
                onClick={sendWhatsAppOrder}
                className="w-full py-3 sm:py-4 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-medium text-base sm:text-lg flex items-center justify-center gap-2"
              >
                <MessageCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                Finalizar pelo WhatsApp
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  const Dashboard = () => {
    const totalProducts = products.length;
    const activeProducts = products.filter(p => p.status === 'active').length;
    const totalValue = products.reduce((sum, p) => sum + p.price, 0);
    const totalViews = products.reduce((sum, p) => sum + (p.views || 0), 0);

    const MetricCard = ({ title, value, icon, bgColor }) => (
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-sm text-gray-600 font-medium mb-1">{title}</p>
            <p className="text-3xl font-bold text-gray-800">{value}</p>
          </div>
          <div className={bgColor + ' p-3 rounded-lg'}>{icon}</div>
        </div>
      </div>
    );

    return (
      <div className="p-6 space-y-6">
        <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard title="Total de Produtos" value={totalProducts} icon={<Package className="w-8 h-8 text-yellow-500" />} bgColor="bg-yellow-50" />
          <MetricCard title="Produtos Ativos" value={activeProducts} icon={<Eye className="w-8 h-8 text-green-500" />} bgColor="bg-green-50" />
          <MetricCard title="Valor Total" value={'R$ ' + totalValue.toFixed(2)} icon={<DollarSign className="w-8 h-8 text-blue-500" />} bgColor="bg-blue-50" />
          <MetricCard title="Visualizações" value={totalViews} icon={<TrendingUp className="w-8 h-8 text-purple-500" />} bgColor="bg-purple-50" />
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Produtos Mais Vistos</h2>
          {products.length > 0 ? (
            <div className="space-y-4">
              {products.sort((a, b) => (b.views || 0) - (a.views || 0)).slice(0, 5).map(product => (
                <div key={product.id} className="flex items-center gap-4 p-4 border rounded-lg">
                  <img src={product.image_urls || 'https://via.placeholder.com/100'} alt={product.name} className="w-16 h-16 object-cover rounded" />
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-800">{product.name}</h3>
                    <p className="text-sm text-gray-600">R$ {product.price.toFixed(2)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">{product.views || 0} views</p>
                    <span className={product.status === 'active' ? 'px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700' : 'px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700'}>
                      {product.status === 'active' ? 'Ativo' : 'Inativo'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Package className="w-12 h-12 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-500">Nenhum produto cadastrado ainda</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  const ProductsManagement = () => {
    const [showForm, setShowForm] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [formData, setFormData] = useState({
      name: '',
      description: '',
      price: 0,
      category_id: categories.length > 0 ? categories[0].id : 1,
      image_urls: '',
      views: 0,
      status: 'active',
      available_sizes: []
    });
    const [imagePreview, setImagePreview] = useState('');
    const [saving, setSaving] = useState(false);
    const [priceInput, setPriceInput] = useState('R$ 0,00');
    const [selectedSizes, setSelectedSizes] = useState([]);

    const handleEdit = (product) => {
      setEditingProduct(product);
      setFormData(product);
      setImagePreview(product.image_urls);
      setPriceInput(formatCurrency(String(product.price * 100)));
      setSelectedSizes(product.available_sizes || []);
      setShowForm(true);
    };

    const getSizesForCategory = (categoryId) => {
      const category = categories.find(c => c.id === parseInt(categoryId));
      if (!category) return [];

      if (category.size_type === 'clothing') {
        return ['PP', 'P', 'M', 'G', 'GG', 'XG', 'XGG'];
      } else if (category.size_type === 'footwear') {
        return ['34/35', '36', '37', '38', '39', '40', '41', '42', '43', '44/45'];
      }
      return [];
    };

    const toggleSize = (size) => {
      const newSizes = selectedSizes.includes(size)
        ? selectedSizes.filter(s => s !== size)
        : [...selectedSizes, size];
      setSelectedSizes(newSizes);
      setFormData(Object.assign({}, formData, { available_sizes: newSizes }));
    };

    const handleDelete = async (id) => {
      if (!confirm('Tem certeza que deseja deletar este produto?')) return;
      try {
        await supabaseAPI.deleteProduct(id);
        await loadAllProducts();
      } catch (error) {
        alert('Erro ao deletar produto');
      }
    };

    const handleToggleStatus = async (product) => {
      try {
        const newStatus = product.status === 'active' ? 'inactive' : 'active';
        await supabaseAPI.updateProduct(product.id, { status: newStatus });
        await loadAllProducts();
      } catch (error) {
        console.error('Erro:', error);
      }
    };

    const handleSubmit = async (e) => {
      e.preventDefault();
      console.log('🔄 Iniciando salvamento de produto...');
      console.log('📦 Dados do produto:', formData);

      // Validar campos obrigatórios
      if (!formData.name || !formData.name.trim()) {
        toast.warning('⚠️ Nome do produto é obrigatório');
        return;
      }

      if (!formData.price || formData.price <= 0) {
        toast.warning('⚠️ Preço do produto é obrigatório e deve ser maior que zero');
        return;
      }

      setSaving(true);
      try {
        if (editingProduct) {
          console.log('✏️ Editando produto:', editingProduct.id);
          const result = await supabaseAPI.updateProduct(editingProduct.id, formData);
          console.log('✅ Resultado:', result);
          toast.success('✅ Produto atualizado com sucesso!');
        } else {
          console.log('➕ Criando novo produto');
          const result = await supabaseAPI.createProduct(formData);
          console.log('✅ Resultado:', result);

          if (result && result[0]) {
            toast.success('✅ Produto cadastrado com sucesso!');
          } else {
            throw new Error('Nenhum dado retornado do servidor');
          }
        }

        await loadAllProducts();
        setShowForm(false);
        setEditingProduct(null);
        setFormData({
          name: '',
          description: '',
          price: 0,
          category_id: categories.length > 0 ? categories[0].id : 1,
          image_urls: '',
          views: 0,
          status: 'active',
          available_sizes: []
        });
        setPriceInput('R$ 0,00');
        setSelectedSizes([]);
        setImagePreview('');
      } catch (error) {
        console.error('❌ Erro ao salvar produto:', error);
        toast.error('❌ Erro ao salvar produto: ' + (error.message || 'Erro desconhecido'));
      } finally {
        setSaving(false);
      }
    };

    const handleImageUpload = (e) => {
      if (e.target.files && e.target.files.length > 0) {
        const file = e.target.files[0];
        const reader = new FileReader();
        reader.onloadend = () => {
          const result = reader.result;
          setImagePreview(result);
          setFormData(Object.assign({}, formData, { image_urls: result }));
        };
        reader.readAsDataURL(file);
      }
    };

    if (showForm) {
      return (
        <div className="p-6">
          <div className="mb-6 flex items-center gap-4">
            <button onClick={() => setShowForm(false)} className="p-2 hover:bg-gray-100 rounded-lg">
              <ArrowLeft className="w-6 h-6" />
            </button>
            <h1 className="text-3xl font-bold text-gray-800">
              {editingProduct ? 'Editar Produto' : 'Novo Produto'}
            </h1>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6 space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Imagem do Produto</label>
              <div className="flex flex-col sm:flex-row gap-4">
                {imagePreview && (
                  <img src={imagePreview} alt="Preview" className="w-32 h-32 object-cover rounded-lg" />
                )}
                <label className="flex-1 border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-yellow-500">
                  <Upload className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                  <span className="text-sm text-gray-600">Clique para fazer upload</span>
                  <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                </label>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Nome do Produto</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(Object.assign({}, formData, { name: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500"
                  placeholder="Ex: Sandália Rakka Ultra"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Preço</label>
                <input
                  type="text"
                  value={priceInput}
                  onChange={(e) => {
                    const formatted = formatCurrency(e.target.value);
                    setPriceInput(formatted);
                    setFormData(Object.assign({}, formData, { price: parseCurrency(formatted) }));
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500"
                  placeholder="R$ 0,00"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Descrição</label>
              <textarea
                rows={4}
                value={formData.description}
                onChange={(e) => setFormData(Object.assign({}, formData, { description: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500"
                placeholder="Descreva o produto..."
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Categoria</label>
                <select
                  value={formData.category_id}
                  onChange={(e) => {
                    const newCategoryId = parseInt(e.target.value);
                    setFormData(Object.assign({}, formData, { category_id: newCategoryId, available_sizes: [] }));
                    setSelectedSizes([]);
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500"
                >
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>

              {getSizesForCategory(formData.category_id).length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tamanhos Disponíveis
                  </label>
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {getSizesForCategory(formData.category_id).map(size => (
                      <button
                        key={size}
                        type="button"
                        onClick={() => toggleSize(size)}
                        className={
                          'px-3 py-2 rounded-lg border-2 font-medium transition-all ' +
                          (selectedSizes.includes(size)
                            ? 'border-yellow-500 bg-yellow-50 text-yellow-700'
                            : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400')
                        }
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    {selectedSizes.length > 0
                      ? `${selectedSizes.length} tamanho(s) selecionado(s)`
                      : 'Selecione os tamanhos disponíveis'
                    }
                  </p>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData(Object.assign({}, formData, { status: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500"
                >
                  <option value="active">Ativo</option>
                  <option value="inactive">Inativo</option>
                </select>
              </div>
            </div>

            <div className="flex gap-4 justify-end pt-6 border-t">
              <button
                onClick={() => setShowForm(false)}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                disabled={saving}
              >
                Cancelar
              </button>
              <button
                onClick={handleSubmit}
                disabled={saving}
                className="px-6 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 flex items-center gap-2 disabled:opacity-50"
              >
                <Save className="w-5 h-5" />
                {saving ? 'Salvando...' : editingProduct ? 'Atualizar' : 'Cadastrar'}
              </button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Gestão de Produtos</h1>
          <button
            onClick={() => setShowForm(true)}
            className="px-6 py-3 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 flex items-center gap-2 font-medium"
          >
            <Plus className="w-5 h-5" />
            Novo Produto
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          {products.length > 0 ? (
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">Produto</th>
                  <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">Preço</th>
                  <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">Status</th>
                  <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">Views</th>
                  <th className="text-right py-4 px-6 text-sm font-semibold text-gray-700">Ações</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product, index) => (
                  <tr key={product.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <img src={product.image_urls || 'https://via.placeholder.com/100'} alt={product.name} className="w-12 h-12 object-cover rounded" />
                        <div>
                          <p className="font-medium text-gray-800">{product.name}</p>
                          <p className="text-sm text-gray-500 truncate max-w-xs">{product.description}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-gray-700 font-medium">R$ {product.price.toFixed(2)}</td>
                    <td className="py-4 px-6">
                      <button
                        onClick={() => handleToggleStatus(product)}
                        className={product.status === 'active' ? 'px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700' : 'px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700'}
                      >
                        {product.status === 'active' ? 'Ativo' : 'Inativo'}
                      </button>
                    </td>
                    <td className="py-4 px-6 text-gray-700">{product.views || 0}</td>
                    <td className="py-4 px-6">
                      <div className="flex gap-2 justify-end">
                        <button onClick={() => handleEdit(product)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg">
                          <Edit2 className="w-5 h-5" />
                        </button>
                        <button onClick={() => handleDelete(product.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg">
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="text-center py-12">
              <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Nenhum produto cadastrado ainda.</p>
              <button onClick={() => setShowForm(true)} className="mt-4 px-6 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600">
                Cadastrar Primeiro Produto
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  const CategoriesManagement = () => {
    const [showForm, setShowForm] = useState(false);
    const [editingCategory, setEditingCategory] = useState(null);
    const [formData, setFormData] = useState({
      name: '',
      status: 'active',
      size_type: null
    });
    const [saving, setSaving] = useState(false);

    const handleEdit = (category) => {
      setEditingCategory(category);
      setFormData(category);
      setShowForm(true);
    };

    const handleDelete = async (id) => {
      if (!confirm('Tem certeza que deseja deletar esta categoria?')) return;
      try {
        await supabaseAPI.deleteCategory(id);
        await loadCategories();
      } catch (error) {
        alert('Erro ao deletar categoria');
      }
    };

    const handleToggleStatus = async (category) => {
      try {
        const newStatus = category.status === 'active' ? 'inactive' : 'active';
        await supabaseAPI.updateCategory(category.id, { status: newStatus });
        await loadCategories();
      } catch (error) {
        console.error('Erro:', error);
      }
    };

    const handleSubmit = async (e) => {
      e.preventDefault();
      console.log('🔄 Iniciando salvamento de categoria...');
      console.log('📦 Dados:', formData);

      if (!formData.name.trim()) {
        toast.warning('⚠️ Nome da categoria é obrigatório');
        return;
      }

      setSaving(true);
      try {
        if (editingCategory) {
          console.log('✏️ Editando categoria:', editingCategory.id);
          const result = await supabaseAPI.updateCategory(editingCategory.id, formData);
          console.log('✅ Resultado:', result);
          toast.success('✅ Categoria atualizada com sucesso!');
        } else {
          console.log('➕ Criando nova categoria');
          const result = await supabaseAPI.createCategory(formData);
          console.log('✅ Resultado:', result);

          if (result && result[0]) {
            toast.success('✅ Categoria criada com sucesso!');
          } else {
            throw new Error('Nenhum dado retornado do servidor');
          }
        }

        await loadCategories();
        setShowForm(false);
        setEditingCategory(null);
        setFormData({
          name: '',
          status: 'active',
          size_type: null
        });
      } catch (error) {
        console.error('❌ Erro ao salvar categoria:', error);
        toast.error('❌ Erro ao salvar categoria: ' + (error.message || 'Erro desconhecido'));
      } finally {
        setSaving(false);
      }
    };

    if (showForm) {
      return (
        <div className="p-6">
          <div className="mb-6 flex items-center gap-4">
            <button onClick={() => setShowForm(false)} className="p-2 hover:bg-gray-100 rounded-lg">
              <ArrowLeft className="w-6 h-6" />
            </button>
            <h1 className="text-3xl font-bold text-gray-800">
              {editingCategory ? 'Editar Categoria' : 'Nova Categoria'}
            </h1>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6 max-w-2xl">
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Nome da Categoria</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(Object.assign({}, formData, { name: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500"
                  placeholder="Ex: Sandálias, Chinelos..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de Tamanho</label>
                <select
                  value={formData.size_type || ''}
                  onChange={(e) => setFormData(Object.assign({}, formData, { size_type: e.target.value || null }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500"
                >
                  <option value="">Sem tamanhos</option>
                  <option value="clothing">Roupas (P, M, G, GG)</option>
                  <option value="footwear">Calçados (34, 36, 38...)</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Selecione se esta categoria possui variações de tamanho
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData(Object.assign({}, formData, { status: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500"
                >
                  <option value="active">Ativo</option>
                  <option value="inactive">Inativo</option>
                </select>
              </div>

              <div className="flex gap-4 justify-end pt-6 border-t">
                <button
                  onClick={() => setShowForm(false)}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  disabled={saving}
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={saving}
                  className="px-6 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 flex items-center gap-2 disabled:opacity-50"
                >
                  <Save className="w-5 h-5" />
                  {saving ? 'Salvando...' : editingCategory ? 'Atualizar' : 'Cadastrar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Gestão de Categorias</h1>
          <button
            onClick={() => setShowForm(true)}
            className="px-6 py-3 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 flex items-center gap-2 font-medium"
          >
            <Plus className="w-5 h-5" />
            Nova Categoria
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          {categories.length > 0 ? (
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">Nome</th>
                  <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">Tipo</th>
                  <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">Status</th>
                  <th className="text-right py-4 px-6 text-sm font-semibold text-gray-700">Ações</th>
                </tr>
              </thead>
              <tbody>
                {categories.map((category, index) => (
                  <tr key={category.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-yellow-100 rounded-lg">
                          <Tag className="w-5 h-5 text-yellow-600" />
                        </div>
                        <p className="font-medium text-gray-800">{category.name}</p>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      {category.size_type ? (
                        <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                          {category.size_type === 'clothing' ? 'Roupas' : 'Calçados'}
                        </span>
                      ) : (
                        <span className="text-sm text-gray-500">Sem tamanho</span>
                      )}
                    </td>
                    <td className="py-4 px-6">
                      <button
                        onClick={() => handleToggleStatus(category)}
                        className={category.status === 'active' ? 'px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700' : 'px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700'}
                      >
                        {category.status === 'active' ? 'Ativo' : 'Inativo'}
                      </button>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex gap-2 justify-end">
                        <button onClick={() => handleEdit(category)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg">
                          <Edit2 className="w-5 h-5" />
                        </button>
                        <button onClick={() => handleDelete(category.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg">
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="text-center py-12">
              <Tag className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Nenhuma categoria cadastrada ainda.</p>
              <button onClick={() => setShowForm(true)} className="mt-4 px-6 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600">
                Cadastrar Primeira Categoria
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block p-4 bg-yellow-100 rounded-full mb-4 animate-pulse">
            <Package className="w-12 h-12 text-yellow-600" />
          </div>
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  if (mode === 'catalog') {
    if (selectedProductId) {
      return (
        <React.Fragment>
          <ProductDetail />
          <CartModal />
        </React.Fragment>
      );
    }
    return (
      <React.Fragment>
        <CatalogGrid />
        <CartModal />
      </React.Fragment>
    );
  }

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  return (
    <div className="flex h-screen bg-gray-100">
      <aside className={(sidebarOpen ? 'w-64' : 'w-20') + ' bg-white shadow-lg transition-all duration-300 flex flex-col'}>
        <div className="p-6 flex items-center justify-between border-b border-gray-200">
          {sidebarOpen && <h1 className="text-xl font-bold text-yellow-500">Lukaya Griffe</h1>}
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="text-gray-600 hover:text-gray-800">
            {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          <button
            onClick={() => setCurrentPage('dashboard')}
            className={'w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ' + (currentPage === 'dashboard' ? 'bg-yellow-500 text-white' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-800')}
          >
            <LayoutDashboard size={20} />
            {sidebarOpen && <span>Dashboard</span>}
          </button>
          <button
            onClick={() => setCurrentPage('products')}
            className={'w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ' + (currentPage === 'products' ? 'bg-yellow-500 text-white' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-800')}
          >
            <Package size={20} />
            {sidebarOpen && <span>Produtos</span>}
          </button>
          <button
            onClick={() => setCurrentPage('categories')}
            className={'w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ' + (currentPage === 'categories' ? 'bg-yellow-500 text-white' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-800')}
          >
            <Tag size={20} />
            {sidebarOpen && <span>Categorias</span>}
          </button>
          <button
            onClick={() => setCurrentPage('banners')}
            className={'w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ' + (currentPage === 'banners' ? 'bg-yellow-500 text-white' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-800')}
          >
            <Sparkles size={20} />
            {sidebarOpen && <span>Banners</span>}
          </button>
        </nav>

        {sidebarOpen && (
          <div className="p-4 border-t border-gray-200 space-y-3">
            <button
              onClick={copyCatalogLink}
              className="w-full flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium"
            >
              {copiedLink ? <Check size={16} /> : <Copy size={16} />}
              {copiedLink ? 'Link Copiado!' : 'Copiar Link'}
            </button>
            <button
              onClick={() => setMode('catalog')}
              className="w-full flex items-center gap-2 px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg text-sm font-medium"
            >
              <ShoppingBag size={16} />
              Ver Catálogo
            </button>
            <div className="text-xs text-gray-500">
              <p className="font-medium text-gray-700 mb-1">Conectado:</p>
              <p className="truncate">{userEmail}</p>
            </div>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-medium"
            >
              <LogOut size={16} />
              Sair
            </button>
          </div>
        )}
      </aside>

      <main className="flex-1 overflow-y-auto">
        {currentPage === 'dashboard' && <Dashboard />}
        {currentPage === 'products' && <ProductsManagement />}
        {currentPage === 'categories' && <CategoriesManagement />}
        {currentPage === 'banners' && (
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-3xl font-bold text-gray-800">Gestão de Banners</h1>
              <p className="text-gray-600">Funcionalidade em desenvolvimento - Use o SQL do TABELAS_NOVAS.sql para criar banners</p>
            </div>
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-8">
              <h3 className="text-lg font-bold text-yellow-800 mb-4">📸 Como criar banners agora:</h3>
              <ol className="list-decimal list-inside space-y-2 text-yellow-900">
                <li>Abra o SQL Editor no Supabase Dashboard</li>
                <li>Execute o script TABELAS_NOVAS.sql (se ainda não executou)</li>
                <li>Use este SQL para criar um banner:
                  <pre className="bg-white p-4 rounded mt-2 text-sm overflow-x-auto">
{`INSERT INTO banners (
  title, description, image_url,
  button_text, is_active, order_index
) VALUES (
  'Black Friday 2025',
  'Até 70% OFF em produtos selecionados!',
  'https://images.unsplash.com/photo-1607083206869-4c7672e72a8a?w=1920',
  'Ver Ofertas',
  true,
  1
);`}
                  </pre>
                </li>
                <li>Banner aparecerá automaticamente no catálogo!</li>
              </ol>
              <p className="mt-4 text-sm text-yellow-700">Interface de upload visual será implementada em breve.</p>
            </div>
          </div>
        )}
      </main>

      {/* Toast Container para notificações */}
      <ToastContainer
        position="top-right"
        autoClose={4000}
        hideProgressBar={false}
        newestOnTop={true}
        closeOnClick
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
    </div>
  );
}
