import React, { useState, useEffect } from 'react';
import { LayoutDashboard, Package, ShoppingBag, Menu, X, TrendingUp, DollarSign, Plus, Edit2, Trash2, Save, ArrowLeft, Eye, Upload, LogOut, Lock, Home, ChevronRight, ShoppingCart, MessageCircle, Minus, Tag, Copy, Check, Moon, Sun, Sparkles, Flame, Settings, Sliders, AlertTriangle, Loader, Users } from 'lucide-react';
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
import BannerManagement from './components/BannerManagement';
import ProductGallery from './components/ProductGallery';
import SettingsPage from './components/Settings';
import TrackingPage from './components/Tracking';
import SDRConfigPage from './components/SDRConfig';

const SUPABASE_URL = ENV.SUPABASE_URL;
const SUPABASE_ANON_KEY = ENV.SUPABASE_ANON_KEY;

// API usando cliente Supabase nativo (mais confiável que fetch)
const supabaseAPI = {
  async getProducts() {
    console.group('📦 GET Products (Active)');
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Erro:', error);
      console.groupEnd();
      throw error;
    }
    console.log('✅ Retornados:', data?.length || 0, 'produtos');
    console.groupEnd();
    return data || [];
  },

  async getProductById(id) {
    console.group('📦 GET Product by ID:', id);
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('❌ Erro:', error);
      console.groupEnd();
      throw error;
    }
    console.log('✅ Produto encontrado:', data?.name);
    console.groupEnd();
    return data;
  },

  async getAllProducts() {
    console.group('📦 GET All Products');
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Erro:', error);
      console.groupEnd();
      throw error;
    }
    console.log('✅ Retornados:', data?.length || 0, 'produtos');
    console.groupEnd();
    return data || [];
  },

  async getCategories() {
    console.group('🏷️ GET Categories (Active)');
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('status', 'active')
      .order('name', { ascending: true });

    if (error) {
      console.error('❌ Erro:', error);
      console.groupEnd();
      throw error;
    }
    console.log('✅ Retornadas:', data?.length || 0, 'categorias');
    console.groupEnd();
    return data || [];
  },

  async getAllCategories() {
    console.group('🏷️ GET All Categories');
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Erro:', error);
      console.groupEnd();
      throw error;
    }
    console.log('✅ Retornadas:', data?.length || 0, 'categorias');
    console.groupEnd();
    return data || [];
  },

  async createProduct(product) {
    console.group('➕ CREATE Product');
    console.log('📤 Dados enviados:', product);

    const { data, error } = await supabase
      .from('products')
      .insert([product])
      .select();

    console.log('📥 Resposta completa:', { data, error });

    if (error) {
      console.error('❌ Erro:', error);
      console.groupEnd();
      throw error;
    }

    if (!data || data.length === 0) {
      console.error('❌ Nenhum dado retornado!');
      console.groupEnd();
      throw new Error('Nenhum dado retornado do servidor');
    }

    console.log('✅ Produto criado:', data[0]);
    console.groupEnd();
    return data;
  },

  async updateProduct(id, product) {
    console.group('✏️ UPDATE Product:', id);
    console.log('📤 Dados enviados:', product);

    const { data, error } = await supabase
      .from('products')
      .update(product)
      .eq('id', id)
      .select();

    if (error) {
      console.error('❌ Erro:', error);
      console.groupEnd();
      throw error;
    }
    console.log('✅ Produto atualizado:', data);
    console.groupEnd();
    return data;
  },

  async deleteProduct(id) {
    console.group('🗑️ DELETE Product:', id);
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('❌ Erro:', error);
      console.groupEnd();
      throw error;
    }
    console.log('✅ Produto deletado');
    console.groupEnd();
    return true;
  },

  async createCategory(category) {
    console.group('➕ CREATE Category');
    console.log('📤 Dados enviados:', category);

    const { data, error } = await supabase
      .from('categories')
      .insert([category])
      .select();

    console.log('📥 Resposta completa:', { data, error });

    if (error) {
      console.error('❌ Erro Supabase:', error);
      console.error('📋 Detalhes:', error.message, error.details, error.hint);
      console.groupEnd();
      throw error;
    }

    if (!data || data.length === 0) {
      console.error('❌ Nenhum dado retornado!');
      console.groupEnd();
      throw new Error('Nenhum dado retornado do servidor');
    }

    console.log('✅ Categoria criada:', data[0]);
    console.groupEnd();
    return data;
  },

  async updateCategory(id, category) {
    console.group('✏️ UPDATE Category:', id);
    console.log('📤 Dados enviados:', category);

    const { data, error } = await supabase
      .from('categories')
      .update(category)
      .eq('id', id)
      .select();

    if (error) {
      console.error('❌ Erro:', error);
      console.groupEnd();
      throw error;
    }
    console.log('✅ Categoria atualizada:', data);
    console.groupEnd();
    return data;
  },

  async deleteCategory(id) {
    console.group('🗑️ DELETE Category:', id);
    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('❌ Erro:', error);
      console.groupEnd();
      throw error;
    }
    console.log('✅ Categoria deletada');
    console.groupEnd();
    return true;
  },

  async incrementViews(productId) {
    // Gerar ou recuperar session_id
    let sessionId = localStorage.getItem('session_id');
    if (!sessionId) {
      sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem('session_id', sessionId);
    }

    try {
      await supabase.rpc('increment_product_view', {
        p_product_id: productId,
        p_session_id: sessionId,
        p_user_agent: navigator.userAgent
      });
    } catch (error) {
      console.error('Erro ao registrar visualização:', error);
    }
  },

  async getProductViews(productId) {
    const { data, error } = await supabase
      .from('product_view_counts')
      .select('total_views')
      .eq('product_id', productId)
      .single();

    if (error) return 0;
    return data?.total_views || 0;
  },

  // Banner APIs usando cliente Supabase
  async getBanners() {
    console.group('📸 GET All Banners');
    const { data, error } = await supabase
      .from('banners')
      .select('*')
      .order('order_index', { ascending: true });

    if (error) {
      console.error('❌ Erro:', error);
      console.groupEnd();
      throw error;
    }
    console.log('✅ Retornados:', data?.length || 0, 'banners');
    console.groupEnd();
    return data || [];
  },

  async getActiveBanner() {
    console.group('📸 GET Active Banner');
    const { data, error } = await supabase
      .from('banners')
      .select('*')
      .eq('is_active', true)
      .order('order_index', { ascending: true })
      .limit(1)
      .single();

    if (error) {
      // Se não encontrar nenhum, não é erro crítico
      if (error.code === 'PGRST116') {
        console.log('ℹ️ Nenhum banner ativo encontrado');
        console.groupEnd();
        return null;
      }
      console.error('❌ Erro:', error);
      console.groupEnd();
      throw error;
    }
    console.log('✅ Banner ativo:', data?.title);
    console.groupEnd();
    return data;
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
  const [activeBanner, setActiveBanner] = useState(null); // Será carregado do banco

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
    console.log('🔄 Carregando banners...');
    try {
      if (mode === 'admin' && isAuthenticated) {
        const data = await supabaseAPI.getBanners();
        setBanners(data || []);
      } else {
        const banner = await supabaseAPI.getActiveBanner();
        console.log('📸 Banner ativo encontrado:', banner);
        setActiveBanner(banner); // null se não encontrar nenhum
      }
    } catch (error) {
      console.error('❌ Erro ao carregar banners:', error);
      setActiveBanner(null); // Em caso de erro, não mostra banner
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
    const whatsappNumber = '5511986751552'; // NÚMERO CORRETO FORÇADO
    console.log('🔍 DEBUG WhatsApp:', {
      numero_usado: whatsappNumber,
      numero_env: ENV.WHATSAPP_NUMBER,
      window_env: window._env_?.VITE_WHATSAPP_NUMBER
    });
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

      // Filtro por tamanho (prioritário e mais específico)
      if (selectedSize && sizeFilterCategory) {
        // Verificar se a categoria do produto corresponde
        const productCategoryId = typeof product.category_id === 'number'
          ? product.category_id
          : parseInt(product.category_id);
        const filterCategoryId = parseInt(sizeFilterCategory);

        if (productCategoryId !== filterCategoryId) return false;

        // Verificar se o produto tem tamanhos disponíveis
        if (!product.available_sizes) return false;

        // Garantir que available_sizes é um array
        const sizes = Array.isArray(product.available_sizes)
          ? product.available_sizes
          : [];

        // Verificar se o tamanho selecionado está disponível
        if (!sizes.includes(selectedSize)) return false;
      }

      // Filtro por categoria normal (apenas quando não há filtro de tamanho)
      if (selectedCategory !== 'all' && !selectedSize) {
        const productCategoryId = typeof product.category_id === 'number'
          ? product.category_id
          : parseInt(product.category_id);
        const filterCategoryId = parseInt(selectedCategory);

        if (productCategoryId !== filterCategoryId) return false;
      }

      // Filtro por preço
      if (priceRange !== 'all') {
        const price = parseFloat(product.price) || 0;
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
                          src={product.image_urls?.[0] || 'https://via.placeholder.com/400'}
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
          await supabaseAPI.incrementViews(selectedProductId);
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
              <ProductGallery images={product.image_urls} />
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

              {/* Informação de Estoque */}
              <div className="mb-4">
                {(product.stock || 0) > 0 ? (
                  <div className="flex items-center gap-2">
                    <Package className="w-5 h-5 text-green-600" />
                    <span className="text-sm font-medium text-green-600">
                      {product.stock} {product.stock === 1 ? 'unidade disponível' : 'unidades disponíveis'}
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Package className="w-5 h-5 text-red-600" />
                    <span className="text-sm font-medium text-red-600">Produto esgotado</span>
                  </div>
                )}
                {(product.stock || 0) > 0 && (product.stock || 0) <= (product.min_stock || 5) && (
                  <p className="text-xs text-amber-600 mt-1">⚠️ Últimas unidades!</p>
                )}
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">QUANTIDADE</label>
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={(product.stock || 0) === 0}
                    className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Minus className="w-5 h-5" />
                  </button>
                  <span className="text-xl font-medium w-12 text-center">{quantity}</span>
                  <button
                    onClick={() => setQuantity(Math.min((product.stock || 0), quantity + 1))}
                    disabled={(product.stock || 0) === 0 || quantity >= (product.stock || 0)}
                    className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  {(product.stock || 0) > 0 ? `Máximo: ${product.stock} unidades` : 'Sem estoque disponível'}
                </p>
              </div>

              <div className="space-y-3 mb-8">
                <button
                  onClick={() => {
                    if ((product.stock || 0) === 0) {
                      toast.error('❌ Produto sem estoque');
                      return;
                    }
                    for (let i = 0; i < quantity; i++) {
                      addToCart(product, selectedSize);
                    }
                    toast.success('✅ Produto adicionado ao carrinho!');
                  }}
                  disabled={(product.stock || 0) === 0}
                  className="w-full py-3 sm:py-4 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors font-medium text-base sm:text-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-400"
                >
                  {(product.stock || 0) === 0 ? 'SEM ESTOQUE' : 'COMPRAR'}
                </button>
                <button
                  onClick={() => {
                    if ((product.stock || 0) === 0) {
                      toast.error('❌ Produto sem estoque');
                      return;
                    }
                    for (let i = 0; i < quantity; i++) {
                      addToCart(product, selectedSize);
                    }
                    setShowCart(true);
                    toast.success('✅ Adicionado ao carrinho!');
                  }}
                  disabled={(product.stock || 0) === 0}
                  className="w-full py-3 sm:py-4 border-2 border-yellow-500 text-yellow-600 rounded-lg hover:bg-yellow-50 transition-colors font-medium text-base sm:text-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:border-gray-400 disabled:text-gray-400"
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
                        src={relProduct.image_urls?.[0] || 'https://via.placeholder.com/400'}
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
                      src={item.image_urls?.[0] || 'https://via.placeholder.com/100'}
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
    const [dateRange, setDateRange] = useState('7days'); // hoje, 7days, 30days, custom
    const [customStartDate, setCustomStartDate] = useState('');
    const [customEndDate, setCustomEndDate] = useState('');
    const [dashboardMetrics, setDashboardMetrics] = useState({
      totalViews: 0,
      uniqueSessions: 0,
      topProducts: [],
      viewsByDate: []
    });
    const [loadingMetrics, setLoadingMetrics] = useState(true);

    useEffect(() => {
      loadDashboardMetrics();
    }, [dateRange, customStartDate, customEndDate]);

    const getDateRange = () => {
      const now = new Date();
      let startDate, endDate;

      if (dateRange === 'hoje') {
        startDate = new Date(now.setHours(0, 0, 0, 0));
        endDate = new Date();
      } else if (dateRange === '7days') {
        startDate = new Date(now.setDate(now.getDate() - 7));
        endDate = new Date();
      } else if (dateRange === '30days') {
        startDate = new Date(now.setDate(now.getDate() - 30));
        endDate = new Date();
      } else if (dateRange === 'custom' && customStartDate && customEndDate) {
        startDate = new Date(customStartDate);
        endDate = new Date(customEndDate);
      } else {
        // Default: últimos 7 dias
        startDate = new Date(now.setDate(now.getDate() - 7));
        endDate = new Date();
      }

      return { startDate, endDate };
    };

    const loadDashboardMetrics = async () => {
      setLoadingMetrics(true);
      try {
        const { startDate, endDate } = getDateRange();

        // Buscar views do período
        const { data: viewsData, error: viewsError } = await supabase
          .from('product_views')
          .select('product_id, session_id, viewed_date, viewed_at')
          .gte('viewed_at', startDate.toISOString())
          .lte('viewed_at', endDate.toISOString());

        if (viewsError) throw viewsError;

        // Calcular métricas
        const totalViews = viewsData?.length || 0;
        const uniqueSessions = new Set(viewsData?.map(v => v.session_id) || []).size;

        // Top produtos por views
        const productViewCounts = {};
        viewsData?.forEach(view => {
          productViewCounts[view.product_id] = (productViewCounts[view.product_id] || 0) + 1;
        });

        const topProductIds = Object.entries(productViewCounts)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([id, count]) => ({ id: parseInt(id), views: count }));

        // Enriquecer com dados dos produtos
        const topProducts = topProductIds
          .map(tp => {
            const product = products.find(p => p.id === tp.id);
            return product ? { ...product, period_views: tp.views } : null;
          })
          .filter(Boolean);

        // Views por dia (últimos 7 dias)
        const viewsByDate = {};
        viewsData?.forEach(view => {
          const date = new Date(view.viewed_at).toLocaleDateString('pt-BR');
          viewsByDate[date] = (viewsByDate[date] || 0) + 1;
        });

        setDashboardMetrics({
          totalViews,
          uniqueSessions,
          topProducts,
          viewsByDate: Object.entries(viewsByDate).sort((a, b) => new Date(a[0]) - new Date(b[0]))
        });
      } catch (error) {
        console.error('Erro ao carregar métricas:', error);
        toast.error('❌ Erro ao carregar métricas');
      } finally {
        setLoadingMetrics(false);
      }
    };

    const totalProducts = products.length;
    const activeProducts = products.filter(p => p.status === 'active').length;
    const totalValue = products.reduce((sum, p) => sum + p.price, 0);
    const lowStockProducts = products.filter(p => (p.stock || 0) <= (p.min_stock || 5)).length;

    const MetricCard = ({ title, value, icon, bgColor, subtitle }) => (
      <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-sm text-gray-600 font-medium mb-1">{title}</p>
            <p className="text-3xl font-bold text-gray-800">{value}</p>
            {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
          </div>
          <div className={bgColor + ' p-3 rounded-lg'}>{icon}</div>
        </div>
      </div>
    );

    return (
      <div className="p-4 md:p-6 space-y-6">
        {/* Header com Título e Filtro de Data */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>
            <p className="text-sm text-gray-600">Visão geral do seu negócio</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
            >
              <option value="hoje">Hoje</option>
              <option value="7days">Últimos 7 dias</option>
              <option value="30days">Últimos 30 dias</option>
              <option value="custom">Personalizado</option>
            </select>

            {dateRange === 'custom' && (
              <div className="flex gap-2">
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 text-sm"
                  placeholder="Data inicial"
                />
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 text-sm"
                  placeholder="Data final"
                />
              </div>
            )}
          </div>
        </div>

        {/* Cards de Métricas Principais */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          <MetricCard
            title="Total de Produtos"
            value={totalProducts}
            icon={<Package className="w-8 h-8 text-yellow-500" />}
            bgColor="bg-yellow-50"
            subtitle={`${activeProducts} ativos`}
          />
          <MetricCard
            title="Visualizações"
            value={loadingMetrics ? '...' : dashboardMetrics.totalViews}
            icon={<Eye className="w-8 h-8 text-blue-500" />}
            bgColor="bg-blue-50"
            subtitle="No período selecionado"
          />
          <MetricCard
            title="Sessões Únicas"
            value={loadingMetrics ? '...' : dashboardMetrics.uniqueSessions}
            icon={<TrendingUp className="w-8 h-8 text-green-500" />}
            bgColor="bg-green-50"
            subtitle="Visitantes únicos"
          />
          <MetricCard
            title="Valor Total"
            value={'R$ ' + totalValue.toFixed(2)}
            icon={<DollarSign className="w-8 h-8 text-purple-500" />}
            bgColor="bg-purple-50"
            subtitle={lowStockProducts > 0 ? `${lowStockProducts} com estoque baixo` : 'Estoque OK'}
          />
        </div>

        {/* Grid de Conteúdo */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Produtos Mais Vistos (Período) */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-800">Mais Vistos no Período</h2>
              {loadingMetrics && <Loader className="w-5 h-5 animate-spin text-yellow-500" />}
            </div>

            {loadingMetrics ? (
              <div className="flex items-center justify-center py-12">
                <Loader className="w-8 h-8 animate-spin text-yellow-500" />
              </div>
            ) : dashboardMetrics.topProducts.length > 0 ? (
              <div className="space-y-3">
                {dashboardMetrics.topProducts.map((product, index) => (
                  <div key={product.id} className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:border-yellow-300 transition-colors">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-yellow-100 flex items-center justify-center">
                      <span className="text-sm font-bold text-yellow-600">#{index + 1}</span>
                    </div>
                    <img
                      src={product.image_urls?.[0] || 'https://via.placeholder.com/60'}
                      alt={product.name}
                      className="w-12 h-12 object-cover rounded"
                    />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-800 text-sm truncate">{product.name}</h3>
                      <p className="text-xs text-gray-600">R$ {product.price.toFixed(2)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-yellow-600">{product.period_views}</p>
                      <p className="text-xs text-gray-500">views</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Eye className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                <p className="text-gray-500">Nenhuma visualização no período</p>
              </div>
            )}
          </div>

          {/* Alertas de Estoque */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Alertas de Estoque</h2>

            {products.filter(p => (p.stock || 0) <= (p.min_stock || 5)).length > 0 ? (
              <div className="space-y-3">
                {products
                  .filter(p => (p.stock || 0) <= (p.min_stock || 5))
                  .slice(0, 5)
                  .map(product => (
                    <div key={product.id} className="flex items-center gap-3 p-3 border border-red-200 bg-red-50 rounded-lg">
                      <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0" />
                      <img
                        src={product.image_urls?.[0] || 'https://via.placeholder.com/60'}
                        alt={product.name}
                        className="w-12 h-12 object-cover rounded"
                      />
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-800 text-sm truncate">{product.name}</h3>
                        <p className="text-xs text-gray-600">R$ {product.price.toFixed(2)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-red-600">{product.stock || 0}</p>
                        <p className="text-xs text-gray-500">unidades</p>
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Package className="w-12 h-12 text-green-300 mx-auto mb-2" />
                <p className="text-gray-500">Todos os produtos com estoque adequado</p>
              </div>
            )}
          </div>
        </div>

        {/* Gráfico de Views por Dia (Lista simples) */}
        {!loadingMetrics && dashboardMetrics.viewsByDate.length > 0 && (
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Visualizações por Dia</h2>
            <div className="space-y-2">
              {dashboardMetrics.viewsByDate.map(([date, count]) => (
                <div key={date} className="flex items-center gap-4">
                  <span className="text-sm text-gray-600 w-24">{date}</span>
                  <div className="flex-1 bg-gray-200 rounded-full h-6 overflow-hidden">
                    <div
                      className="bg-yellow-500 h-full flex items-center justify-end pr-2 rounded-full transition-all"
                      style={{ width: `${(count / Math.max(...dashboardMetrics.viewsByDate.map(v => v[1]))) * 100}%` }}
                    >
                      <span className="text-xs font-bold text-white">{count}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
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
      status: 'active',
      stock: 50,
      min_stock: 5,
    });
    const [imageFiles, setImageFiles] = useState([]); // ARRAY de Files
    const [imagePreviews, setImagePreviews] = useState([]); // ARRAY de previews
    const [saving, setSaving] = useState(false);
    const [priceInput, setPriceInput] = useState('R$ 0,00');
    const [selectedSizes, setSelectedSizes] = useState([]);

    const handleEdit = (product) => {
      setEditingProduct(product);
      setFormData({
        name: product.name,
        description: product.description,
        price: product.price,
        category_id: product.category_id,
        status: product.status,
        stock: product.stock || 0,
        min_stock: product.min_stock || 5,
      });
      // Se tiver imagens existentes, mostrar previews
      if (product.image_urls && Array.isArray(product.image_urls)) {
        setImagePreviews(product.image_urls);
      } else if (product.image_urls) {
        setImagePreviews([product.image_urls]);
      } else {
        setImagePreviews([]);
      }
      setPriceInput(formatCurrency(String(product.price * 100)));
      setSelectedSizes(product.available_sizes || []);
      setImageFiles([]); // Resetar files ao editar
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
    };

    const handleDelete = async (id) => {
      if (!confirm('Tem certeza que deseja deletar este produto?')) return;
      try {
        await supabaseAPI.deleteProduct(id);
        toast.success('✅ Produto deletado com sucesso!');
        await loadAllProducts();
      } catch (error) {
        console.error('❌ Erro ao deletar:', error);
        toast.error('❌ Erro ao deletar produto');
      }
    };

    const handleToggleStatus = async (product) => {
      try {
        const newStatus = product.status === 'active' ? 'inactive' : 'active';
        await supabaseAPI.updateProduct(product.id, { status: newStatus });
        toast.success(`✅ Produto ${newStatus === 'active' ? 'ativado' : 'desativado'}!`);
        await loadAllProducts();
      } catch (error) {
        console.error('❌ Erro:', error);
        toast.error('❌ Erro ao alterar status');
      }
    };

    const handleSubmit = async (e) => {
      e.preventDefault();
      console.group('💾 Salvando Produto');
      console.log('📦 FormData:', formData);
      console.log('🖼️ ImageFiles:', imageFiles.length, 'arquivos');

      // Validar campos obrigatórios
      if (!formData.name || !formData.name.trim()) {
        toast.warning('⚠️ Nome do produto é obrigatório');
        console.groupEnd();
        return;
      }

      if (!formData.price || formData.price <= 0) {
        toast.warning('⚠️ Preço do produto é obrigatório e deve ser maior que zero');
        console.groupEnd();
        return;
      }

      setSaving(true);
      try {
        // Começar com as imagens existentes (se estiver editando)
        let imageUrls = [];
        if (editingProduct && editingProduct.image_urls) {
          imageUrls = Array.isArray(editingProduct.image_urls)
            ? [...editingProduct.image_urls]
            : [editingProduct.image_urls];
        }

        // 1. FAZER UPLOAD DE TODAS AS NOVAS IMAGENS
        if (imageFiles && imageFiles.length > 0) {
          console.log(`📸 Fazendo upload de ${imageFiles.length} imagens...`);

          for (let i = 0; i < imageFiles.length; i++) {
            const file = imageFiles[i];

            if (!(file instanceof File)) continue;

            const fileExt = file.name.split('.').pop();
            const fileName = `${Date.now()}-${i}-${Math.random().toString(36).substring(7)}.${fileExt}`;
            const filePath = `products/${fileName}`;

            // Upload para storage
            const { data: uploadData, error: uploadError } = await supabase.storage
              .from('product-images')
              .upload(filePath, file);

            if (uploadError) {
              console.error(`❌ Erro upload imagem ${i + 1}:`, uploadError);

              // Se o erro for que o bucket não existe, avisar
              if (uploadError.message.includes('not found')) {
                toast.error('❌ Bucket "product-images" não existe! Crie no Supabase Storage.');
              } else {
                toast.error(`❌ Erro ao fazer upload da imagem ${i + 1}: ` + uploadError.message);
              }
              console.groupEnd();
              setSaving(false);
              return;
            }

            // Pegar URL pública
            const { data: urlData } = supabase.storage
              .from('product-images')
              .getPublicUrl(filePath);

            imageUrls.push(urlData.publicUrl);
            console.log(`✅ Imagem ${i + 1}/${imageFiles.length} enviada:`, urlData.publicUrl);
          }
        }

        // 2. PREPARAR DADOS DO PRODUTO (apenas campos que existem na tabela)
        const productData = {
          name: formData.name.trim(),
          description: formData.description?.trim() || '',
          price: parseFloat(formData.price), // GARANTIR que é número
          category_id: formData.category_id || null,
          image_urls: imageUrls, // ✅ ARRAY de URLs (não string!)
          status: formData.status || 'active',
          available_sizes: selectedSizes.length > 0 ? selectedSizes : [], // ✅ ARRAY também
          stock: parseInt(formData.stock) || 0, // ✅ Estoque atual
          min_stock: parseInt(formData.min_stock) || 5, // ✅ Estoque mínimo
        };

        // Remover campos null/undefined
        Object.keys(productData).forEach(key => {
          if (productData[key] === null || productData[key] === undefined) {
            delete productData[key];
          }
        });

        console.log('📤 Dados a enviar:', productData);
        console.log('📏 URLs de imagens:', imageUrls.length);
        console.log('🔢 Tamanhos disponíveis:', selectedSizes);

        // 3. CRIAR ou ATUALIZAR
        if (editingProduct) {
          console.log('✏️ Atualizando produto:', editingProduct.id);
          const result = await supabaseAPI.updateProduct(editingProduct.id, productData);
          console.log('✅ Resultado:', result);
          toast.success('✅ Produto atualizado com sucesso!');
        } else {
          console.log('➕ Criando novo produto');
          const result = await supabaseAPI.createProduct(productData);
          console.log('✅ Resultado:', result);

          if (result && result[0]) {
            toast.success('✅ Produto cadastrado com sucesso!');
          } else {
            throw new Error('Nenhum dado retornado do servidor');
          }
        }

        // Limpar form
        await loadAllProducts();
        setShowForm(false);
        setEditingProduct(null);
        setFormData({
          name: '',
          description: '',
          price: 0,
          category_id: categories.length > 0 ? categories[0].id : 1,
          status: 'active',
        });
        setPriceInput('R$ 0,00');
        setSelectedSizes([]);
        setImagePreviews([]);
        setImageFiles([]);

        console.log('✅ Produto salvo e form resetado');
        console.groupEnd();

      } catch (error) {
        console.error('❌ Erro ao salvar produto:', error);
        console.error('📋 Detalhes:', error.message, error.details, error.hint);
        toast.error('❌ Erro ao salvar produto: ' + (error.message || 'Erro desconhecido'));
        console.groupEnd();
      } finally {
        setSaving(false);
      }
    };

    const handleImageUpload = (e) => {
      if (e.target.files && e.target.files.length > 0) {
        const files = Array.from(e.target.files);

        // Validar quantidade (máx 6 imagens)
        if (files.length > 6) {
          toast.error('❌ Máximo de 6 imagens por produto');
          return;
        }

        // Validar cada arquivo
        const validFiles = [];
        const newPreviews = [];

        for (const file of files) {
          // Validar tipo
          if (!file.type.startsWith('image/')) {
            toast.error(`❌ ${file.name} não é uma imagem válida`);
            continue;
          }

          // Validar tamanho (máx 5MB cada)
          if (file.size > 5 * 1024 * 1024) {
            toast.error(`❌ ${file.name} excede 5MB`);
            continue;
          }

          validFiles.push(file);

          // Criar preview
          const reader = new FileReader();
          reader.onloadend = () => {
            newPreviews.push(reader.result);
            // Só atualizar quando todas estiverem prontas
            if (newPreviews.length === validFiles.length) {
              setImagePreviews(newPreviews);
            }
          };
          reader.readAsDataURL(file);
        }

        setImageFiles(validFiles);

        if (validFiles.length > 0) {
          console.log(`📸 ${validFiles.length} imagens selecionadas`);
          validFiles.forEach((f, i) => {
            console.log(`  ${i + 1}. ${f.name} (${(f.size / 1024).toFixed(2)} KB)`);
          });
        }
      }
    };

    const removeImage = (index) => {
      const newFiles = imageFiles.filter((_, i) => i !== index);
      const newPreviews = imagePreviews.filter((_, i) => i !== index);
      setImageFiles(newFiles);
      setImagePreviews(newPreviews);
      toast.info(`🗑️ Imagem ${index + 1} removida`);
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
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Imagens do Produto *
                <span className="text-xs text-gray-500 font-normal ml-2">(Máximo 6 imagens)</span>
              </label>

              {/* Preview das imagens selecionadas */}
              {imagePreviews.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 mb-4">
                  {imagePreviews.map((preview, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={preview}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-24 object-cover rounded-lg border-2 border-gray-200"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X size={14} />
                      </button>
                      <div className="absolute bottom-1 left-1 bg-black/50 text-white text-xs px-1.5 py-0.5 rounded">
                        {index + 1}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Área de upload */}
              <label className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-yellow-500 hover:bg-yellow-50 transition-colors block">
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                <span className="text-sm text-gray-600 block mb-1">
                  Clique para selecionar imagens
                </span>
                <span className="text-xs text-gray-500">
                  Você pode selecionar múltiplas imagens (frente, costas, detalhes, etc)
                </span>
                <span className="text-xs text-gray-400 block mt-1">
                  PNG, JPG, WEBP - Máximo 5MB cada
                </span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </label>
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

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Estoque Atual</label>
                <input
                  type="number"
                  min="0"
                  value={formData.stock || 0}
                  onChange={(e) => setFormData(Object.assign({}, formData, { stock: parseInt(e.target.value) || 0 }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500"
                  placeholder="Ex: 50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Estoque Mínimo</label>
                <input
                  type="number"
                  min="0"
                  value={formData.min_stock || 5}
                  onChange={(e) => setFormData(Object.assign({}, formData, { min_stock: parseInt(e.target.value) || 5 }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500"
                  placeholder="Ex: 5"
                />
              </div>
            </div>

            {/* Sincronização com Marketplaces - Só aparece ao editar produto existente */}
            {editingProduct && editingProduct.id && (
              <div className="pt-6 border-t">
                <h3 className="text-lg font-bold text-gray-800 mb-4">
                  Publicar em Marketplaces
                </h3>
                <ProductMarketplaces productId={editingProduct.id} darkMode={false} />
              </div>
            )}

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
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Gestão de Produtos</h1>
          <button
            onClick={() => setShowForm(true)}
            className="w-full md:w-auto min-h-[44px] px-6 py-3 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 flex items-center justify-center gap-2 font-medium transition-colors"
          >
            <Plus className="w-5 h-5" />
            Novo Produto
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          {products.length > 0 ? (
            <>
              {/* Desktop Table View */}
              <table className="w-full hidden md:table">
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
                          <img src={product.image_urls?.[0] || 'https://via.placeholder.com/100'} alt={product.name} className="w-12 h-12 object-cover rounded" />
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

              {/* Mobile Card View */}
              <div className="md:hidden divide-y divide-gray-200">
                {products.map((product) => (
                  <div key={product.id} className="p-4">
                    <div className="flex gap-3 mb-3">
                      <img
                        src={product.image_urls?.[0] || 'https://via.placeholder.com/100'}
                        alt={product.name}
                        className="w-20 h-20 object-cover rounded-lg flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-800 mb-1">{product.name}</h3>
                        <p className="text-sm text-gray-600 line-clamp-2 mb-2">{product.description}</p>
                        <div className="flex items-center gap-2">
                          <span className="text-lg font-bold text-yellow-600">
                            R$ {product.price.toFixed(2)}
                          </span>
                          <button
                            onClick={() => handleToggleStatus(product)}
                            className={product.status === 'active' ? 'px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700' : 'px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700'}
                          >
                            {product.status === 'active' ? 'Ativo' : 'Inativo'}
                          </button>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                      <div className="flex items-center gap-1 text-sm text-gray-600">
                        <Eye size={16} />
                        <span>{product.views || 0} views</span>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(product)}
                          className="flex items-center gap-1 px-3 py-1.5 text-blue-600 hover:bg-blue-50 rounded-lg text-sm font-medium"
                        >
                          <Edit2 size={16} />
                          Editar
                        </button>
                        <button
                          onClick={() => handleDelete(product.id)}
                          className="flex items-center gap-1 px-3 py-1.5 text-red-600 hover:bg-red-50 rounded-lg text-sm font-medium"
                        >
                          <Trash2 size={16} />
                          Deletar
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
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
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Gestão de Categorias</h1>
          <button
            onClick={() => setShowForm(true)}
            className="w-full md:w-auto min-h-[44px] px-6 py-3 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 flex items-center justify-center gap-2 font-medium transition-colors"
          >
            <Plus className="w-5 h-5" />
            Nova Categoria
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          {categories.length > 0 ? (
            <>
              {/* Desktop Table View */}
              <table className="w-full hidden md:table">
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

              {/* Mobile Card View */}
              <div className="md:hidden divide-y divide-gray-200">
                {categories.map((category) => (
                  <div key={category.id} className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-yellow-100 rounded-lg">
                          <Tag className="w-5 h-5 text-yellow-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-800">{category.name}</h3>
                          {category.size_type ? (
                            <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                              {category.size_type === 'clothing' ? 'Roupas' : 'Calçados'}
                            </span>
                          ) : (
                            <span className="text-xs text-gray-500">Sem tamanho</span>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => handleToggleStatus(category)}
                        className={category.status === 'active' ? 'px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700' : 'px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700'}
                      >
                        {category.status === 'active' ? 'Ativo' : 'Inativo'}
                      </button>
                    </div>
                    <div className="flex gap-2 pt-3 border-t border-gray-100">
                      <button
                        onClick={() => handleEdit(category)}
                        className="flex-1 flex items-center justify-center gap-1 px-3 py-2 text-blue-600 hover:bg-blue-50 rounded-lg text-sm font-medium"
                      >
                        <Edit2 size={16} />
                        Editar
                      </button>
                      <button
                        onClick={() => handleDelete(category.id)}
                        className="flex-1 flex items-center justify-center gap-1 px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg text-sm font-medium"
                      >
                        <Trash2 size={16} />
                        Deletar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
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
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      {/* Mobile Header - Only visible on mobile */}
      <div className="md:hidden fixed top-0 left-0 right-0 bg-white shadow-md z-40 px-4 py-3 flex items-center justify-between">
        <h1 className="text-lg font-bold text-yellow-500">Lukaya Griffe</h1>
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="text-gray-600 hover:text-gray-800 p-2"
        >
          <Menu size={24} />
        </button>
      </div>

      {/* Backdrop overlay for mobile */}
      {sidebarOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        ${sidebarOpen ? 'w-64' : 'w-20'}
        bg-white shadow-lg transition-all duration-300 flex flex-col
        md:relative fixed inset-y-0 left-0 z-50
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <div className="p-6 flex items-center justify-between border-b border-gray-200">
          {sidebarOpen && <h1 className="text-xl font-bold text-yellow-500">Lukaya Griffe</h1>}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="text-gray-600 hover:text-gray-800 hidden md:block"
          >
            {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
          {/* Close button for mobile */}
          <button
            onClick={() => setSidebarOpen(false)}
            className="text-gray-600 hover:text-gray-800 md:hidden"
          >
            <X size={24} />
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          <button
            onClick={() => {
              setCurrentPage('dashboard');
              // Close sidebar on mobile
              if (window.innerWidth < 768) setSidebarOpen(false);
            }}
            className={'w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ' + (currentPage === 'dashboard' ? 'bg-yellow-500 text-white' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-800')}
          >
            <LayoutDashboard size={20} />
            {sidebarOpen && <span>Dashboard</span>}
          </button>
          <button
            onClick={() => {
              setCurrentPage('products');
              if (window.innerWidth < 768) setSidebarOpen(false);
            }}
            className={'w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ' + (currentPage === 'products' ? 'bg-yellow-500 text-white' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-800')}
          >
            <Package size={20} />
            {sidebarOpen && <span>Produtos</span>}
          </button>
          <button
            onClick={() => {
              setCurrentPage('categories');
              if (window.innerWidth < 768) setSidebarOpen(false);
            }}
            className={'w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ' + (currentPage === 'categories' ? 'bg-yellow-500 text-white' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-800')}
          >
            <Tag size={20} />
            {sidebarOpen && <span>Categorias</span>}
          </button>
          <button
            onClick={() => {
              setCurrentPage('integrations');
              if (window.innerWidth < 768) setSidebarOpen(false);
            }}
            className={'w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ' + (currentPage === 'integrations' ? 'bg-yellow-500 text-white' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-800')}
          >
            <Settings size={20} />
            {sidebarOpen && <span>Integrações</span>}
          </button>
          <button
            onClick={() => {
              setCurrentPage('banners');
              if (window.innerWidth < 768) setSidebarOpen(false);
            }}
            className={'w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ' + (currentPage === 'banners' ? 'bg-yellow-500 text-white' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-800')}
          >
            <Sparkles size={20} />
            {sidebarOpen && <span>Banners</span>}
          </button>
          <button
            onClick={() => {
              setCurrentPage('settings');
              if (window.innerWidth < 768) setSidebarOpen(false);
            }}
            className={'w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ' + (currentPage === 'settings' ? 'bg-yellow-500 text-white' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-800')}
          >
            <Sliders size={20} />
            {sidebarOpen && <span>Configurações</span>}
          </button>
          <button
            onClick={() => {
              setCurrentPage('tracking');
              if (window.innerWidth < 768) setSidebarOpen(false);
            }}
            className={'w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ' + (currentPage === 'tracking' ? 'bg-yellow-500 text-white' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-800')}
          >
            <TrendingUp size={20} />
            {sidebarOpen && <span>Tracking</span>}
          </button>
          <button
            onClick={() => {
              setCurrentPage('sdr-config');
              if (window.innerWidth < 768) setSidebarOpen(false);
            }}
            className={'w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ' + (currentPage === 'sdr-config' ? 'bg-yellow-500 text-white' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-800')}
          >
            <Users size={20} />
            {sidebarOpen && <span>SDR Config</span>}
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
              onClick={() => {
                setMode('catalog');
                if (window.innerWidth < 768) setSidebarOpen(false);
              }}
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

      <main className="flex-1 overflow-y-auto md:pt-0 pt-16">
        {currentPage === 'dashboard' && <Dashboard />}
        {currentPage === 'products' && <ProductsManagement />}
        {currentPage === 'categories' && <CategoriesManagement />}
        {currentPage === 'integrations' && (
          <div className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <Settings className="w-8 h-8 text-yellow-600" />
              <h1 className="text-3xl font-bold text-gray-800">Integrações com Marketplaces</h1>
            </div>
            <p className="text-gray-600 mb-8">Configure as credenciais dos marketplaces para sincronizar seus produtos automaticamente.</p>
            <MarketplaceSettings darkMode={darkMode} />
          </div>
        )}
        {currentPage === 'banners' && (
          <BannerManagement />
        )}
        {currentPage === 'settings' && (
          <SettingsPage />
        )}
        {currentPage === 'tracking' && (
          <TrackingPage />
        )}
        {currentPage === 'sdr-config' && (
          <SDRConfigPage />
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
