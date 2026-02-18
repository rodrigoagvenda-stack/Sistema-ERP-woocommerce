import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { toast } from 'react-toastify';
import { Settings as SettingsIcon, Save, Loader, Store, Phone, Mail, MapPin, Package, DollarSign, Globe } from 'lucide-react';

// Toggle Switch Moderno
const ToggleSwitch = ({ checked, onChange, label, description }) => (
  <div className="flex items-center justify-between py-3">
    <div className="flex-1">
      <p className="text-sm font-medium text-gray-900">{label}</p>
      {description && <p className="text-xs text-gray-500 mt-0.5">{description}</p>}
    </div>
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 ${
        checked ? 'bg-yellow-500' : 'bg-gray-200'
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
          checked ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  </div>
);

export default function Settings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    whatsapp_number: '+5511986751552',
    store_name: 'Geezer',
    store_email: '',
    store_address: '',
    min_stock_alert: 5,
    auto_publish_products: false,
    enable_dark_mode: false,
    default_tax_rate: 0,
    currency: 'BRL',
    timezone: 'America/Sao_Paulo'
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('settings')
        .select('*')
        .eq('id', 1)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setSettings(data);
      }
    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
      toast.error('❌ Erro ao carregar configurações');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('settings')
        .upsert({
          id: 1,
          ...settings,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;

      toast.success('✅ Configurações salvas com sucesso!');
      await loadSettings();
    } catch (error) {
      console.error('Erro ao salvar:', error);
      toast.error('❌ Erro ao salvar: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field, value) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader className="w-8 h-8 animate-spin text-yellow-500" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-yellow-100 rounded-lg">
          <SettingsIcon className="w-7 h-7 text-yellow-600" />
        </div>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Configurações</h1>
          <p className="text-sm text-gray-600">Gerencie as configurações da sua loja</p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Informações da Loja */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
            <div className="flex items-center gap-2">
              <Store className="w-5 h-5 text-gray-700" />
              <h2 className="text-lg font-bold text-gray-900">Informações da Loja</h2>
            </div>
          </div>
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nome da Loja
                </label>
                <input
                  type="text"
                  value={settings.store_name || ''}
                  onChange={(e) => handleChange('store_name', e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-colors"
                  placeholder="Geezer"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  WhatsApp (com +55)
                </label>
                <input
                  type="text"
                  value={settings.whatsapp_number || ''}
                  onChange={(e) => handleChange('whatsapp_number', e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-colors"
                  placeholder="+5511986751552"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  E-mail da Loja
                </label>
                <input
                  type="email"
                  value={settings.store_email || ''}
                  onChange={(e) => handleChange('store_email', e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-colors"
                  placeholder="contato@geezer.com.br"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  Endereço
                </label>
                <input
                  type="text"
                  value={settings.store_address || ''}
                  onChange={(e) => handleChange('store_address', e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-colors"
                  placeholder="Rua exemplo, 123 - São Paulo, SP"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Estoque */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
            <div className="flex items-center gap-2">
              <Package className="w-5 h-5 text-gray-700" />
              <h2 className="text-lg font-bold text-gray-900">Estoque e Produtos</h2>
            </div>
          </div>
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Estoque Mínimo (alerta)
                </label>
                <input
                  type="number"
                  min="0"
                  value={settings.min_stock_alert || 5}
                  onChange={(e) => handleChange('min_stock_alert', parseInt(e.target.value) || 0)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-colors"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Produtos abaixo deste valor mostram alerta
                </p>
              </div>

              <div className="flex items-center">
                <ToggleSwitch
                  checked={settings.auto_publish_products || false}
                  onChange={(val) => handleChange('auto_publish_products', val)}
                  label="Publicar produtos automaticamente"
                  description="Novos produtos ficam ativos imediatamente"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Financeiro */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
            <div className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-gray-700" />
              <h2 className="text-lg font-bold text-gray-900">Configurações Financeiras</h2>
            </div>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Moeda Padrão
                </label>
                <select
                  value={settings.currency || 'BRL'}
                  onChange={(e) => handleChange('currency', e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-colors"
                >
                  <option value="BRL">Real (R$)</option>
                  <option value="USD">Dólar (US$)</option>
                  <option value="EUR">Euro (€)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Taxa de Imposto Padrão (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={settings.default_tax_rate || 0}
                  onChange={(e) => handleChange('default_tax_rate', parseFloat(e.target.value) || 0)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-colors"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Sistema */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
            <div className="flex items-center gap-2">
              <Globe className="w-5 h-5 text-gray-700" />
              <h2 className="text-lg font-bold text-gray-900">Sistema</h2>
            </div>
          </div>
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fuso Horário
                </label>
                <select
                  value={settings.timezone || 'America/Sao_Paulo'}
                  onChange={(e) => handleChange('timezone', e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-colors"
                >
                  <option value="America/Sao_Paulo">Brasília (GMT-3)</option>
                  <option value="America/Manaus">Manaus (GMT-4)</option>
                  <option value="America/Rio_Branco">Acre (GMT-5)</option>
                </select>
              </div>

              <div className="flex items-center">
                <ToggleSwitch
                  checked={settings.enable_dark_mode || false}
                  onChange={(val) => handleChange('enable_dark_mode', val)}
                  label="Modo escuro por padrão"
                  description="Ativar tema escuro para novos visitantes"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Botão Salvar */}
        <div className="flex justify-end">
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-8 py-3 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 active:bg-yellow-700 flex items-center gap-2 font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow-md"
          >
            {saving ? (
              <>
                <Loader className="w-5 h-5 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                Salvar Configurações
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
