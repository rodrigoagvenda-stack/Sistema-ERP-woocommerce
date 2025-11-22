import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { toast } from 'react-toastify';
import { Settings as SettingsIcon, Save, Loader } from 'lucide-react';

export default function Settings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    whatsapp_number: '',
    store_name: '',
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
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setSettings(data);
      }
    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
      toast.error('Erro ao carregar configurações');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('settings')
        .upsert([{
          id: 1,
          ...settings,
          updated_at: new Date().toISOString()
        }]);

      if (error) throw error;

      toast.success('✅ Configurações salvas com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar:', error);
      toast.error('❌ Erro ao salvar configurações');
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
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <SettingsIcon className="w-8 h-8 text-yellow-600" />
        <h1 className="text-3xl font-bold text-gray-800">Configurações</h1>
      </div>

      <div className="bg-white rounded-xl shadow-md p-6 space-y-8">
        {/* Informações da Loja */}
        <section>
          <h2 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2">
            Informações da Loja
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nome da Loja
              </label>
              <input
                type="text"
                value={settings.store_name || ''}
                onChange={(e) => handleChange('store_name', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500"
                placeholder="Lukaya Griffe"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                WhatsApp (com +55)
              </label>
              <input
                type="text"
                value={settings.whatsapp_number || ''}
                onChange={(e) => handleChange('whatsapp_number', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500"
                placeholder="+5511986751552"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                E-mail da Loja
              </label>
              <input
                type="email"
                value={settings.store_email || ''}
                onChange={(e) => handleChange('store_email', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500"
                placeholder="contato@lukayagriffe.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Endereço
              </label>
              <input
                type="text"
                value={settings.store_address || ''}
                onChange={(e) => handleChange('store_address', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500"
                placeholder="Rua exemplo, 123 - São Paulo, SP"
              />
            </div>
          </div>
        </section>

        {/* Configurações de Estoque */}
        <section>
          <h2 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2">
            Estoque e Produtos
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Estoque Mínimo (alerta)
              </label>
              <input
                type="number"
                min="0"
                value={settings.min_stock_alert || 5}
                onChange={(e) => handleChange('min_stock_alert', parseInt(e.target.value))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Produtos com estoque abaixo deste valor mostram alerta
              </p>
            </div>

            <div className="flex items-center">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.auto_publish_products || false}
                  onChange={(e) => handleChange('auto_publish_products', e.target.checked)}
                  className="w-5 h-5 rounded"
                />
                <span className="text-sm font-medium text-gray-700">
                  Publicar produtos automaticamente
                </span>
              </label>
            </div>
          </div>
        </section>

        {/* Configurações Financeiras */}
        <section>
          <h2 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2">
            Configurações Financeiras
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Moeda Padrão
              </label>
              <select
                value={settings.currency || 'BRL'}
                onChange={(e) => handleChange('currency', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500"
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
                onChange={(e) => handleChange('default_tax_rate', parseFloat(e.target.value))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500"
              />
            </div>
          </div>
        </section>

        {/* Configurações de Sistema */}
        <section>
          <h2 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2">
            Sistema
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fuso Horário
              </label>
              <select
                value={settings.timezone || 'America/Sao_Paulo'}
                onChange={(e) => handleChange('timezone', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500"
              >
                <option value="America/Sao_Paulo">Brasília (GMT-3)</option>
                <option value="America/Manaus">Manaus (GMT-4)</option>
                <option value="America/Rio_Branco">Acre (GMT-5)</option>
              </select>
            </div>

            <div className="flex items-center">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.enable_dark_mode || false}
                  onChange={(e) => handleChange('enable_dark_mode', e.target.checked)}
                  className="w-5 h-5 rounded"
                />
                <span className="text-sm font-medium text-gray-700">
                  Modo escuro por padrão
                </span>
              </label>
            </div>
          </div>
        </section>

        {/* Botão Salvar */}
        <div className="flex justify-end pt-4 border-t">
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-8 py-3 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 flex items-center gap-2 font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
