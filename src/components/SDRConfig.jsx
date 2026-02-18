import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { toast } from 'react-toastify';
import {
  Users,
  Bell,
  MessageCircle,
  Clock,
  Target,
  Zap,
  Save,
  Loader,
  Settings as SettingsIcon,
  Mail,
  Phone
} from 'lucide-react';

// Toggle Switch Component
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

export default function SDRConfig() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState({
    // WhatsApp Automation
    auto_whatsapp_enabled: true,
    auto_reply_message: 'Olá! Obrigado pelo interesse. Em breve um de nossos consultores entrará em contato! 👋',
    business_hours_only: true,
    business_start_hour: '09:00',
    business_end_hour: '18:00',

    // Lead Management
    lead_auto_assign: false,
    lead_response_time_target: 5, // minutos
    follow_up_reminder_hours: 24,
    max_lead_attempts: 3,

    // Notifications
    notify_new_inquiry: true,
    notify_abandoned_cart: true,
    notify_low_stock: true,
    notification_email: '',
    notification_whatsapp: '',

    // Sales Targets
    daily_contact_target: 50,
    weekly_sales_target: 10,
    conversion_rate_target: 20, // %

    // Automation Rules
    auto_send_catalog: true,
    auto_send_promotions: false,
    auto_tag_leads: true,
    lead_score_enabled: true
  });

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    setLoading(true);
    try {
      // Tentar carregar configurações do SDR da tabela settings ou criar tabela específica
      const { data, error } = await supabase
        .from('settings')
        .select('*')
        .eq('id', 1)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Erro ao carregar config:', error);
      }

      // Se existirem campos SDR, carregar, caso contrário usar defaults
      if (data) {
        setConfig(prev => ({
          ...prev,
          notification_email: data.store_email || '',
          notification_whatsapp: data.whatsapp_number || '',
          // Outros campos viriam de uma tabela sdr_config se existir
        }));
      }
    } catch (error) {
      console.error('Erro ao carregar configurações SDR:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Por enquanto, salvar no localStorage até criar tabela específica
      localStorage.setItem('sdr_config', JSON.stringify(config));
      toast.success('✅ Configurações SDR salvas com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar:', error);
      toast.error('❌ Erro ao salvar configurações');
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field, value) => {
    setConfig(prev => ({ ...prev, [field]: value }));
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
        <div className="p-3 bg-purple-100 rounded-lg">
          <Users className="w-7 h-7 text-purple-600" />
        </div>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Configurações SDR</h1>
          <p className="text-sm text-gray-600">Sales Development Representative - Configurações de vendas e automação</p>
        </div>
      </div>

      <div className="space-y-6">
        {/* WhatsApp Automation */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
            <div className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-gray-700" />
              <h2 className="text-lg font-bold text-gray-900">Automação WhatsApp</h2>
            </div>
          </div>
          <div className="p-6 space-y-4">
            <ToggleSwitch
              checked={config.auto_whatsapp_enabled}
              onChange={(val) => handleChange('auto_whatsapp_enabled', val)}
              label="Resposta automática ativa"
              description="Enviar mensagem automática para novos contatos"
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mensagem de resposta automática
              </label>
              <textarea
                value={config.auto_reply_message}
                onChange={(e) => handleChange('auto_reply_message', e.target.value)}
                rows={3}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-colors"
                placeholder="Digite a mensagem automática..."
              />
            </div>

            <ToggleSwitch
              checked={config.business_hours_only}
              onChange={(val) => handleChange('business_hours_only', val)}
              label="Apenas em horário comercial"
              description="Responder automaticamente somente no horário de expediente"
            />

            {config.business_hours_only && (
              <div className="grid grid-cols-2 gap-4 pl-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Horário inicial
                  </label>
                  <input
                    type="time"
                    value={config.business_start_hour}
                    onChange={(e) => handleChange('business_start_hour', e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Horário final
                  </label>
                  <input
                    type="time"
                    value={config.business_end_hour}
                    onChange={(e) => handleChange('business_end_hour', e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500"
                  />
                </div>
              </div>
            )}

            <ToggleSwitch
              checked={config.auto_send_catalog}
              onChange={(val) => handleChange('auto_send_catalog', val)}
              label="Enviar catálogo automaticamente"
              description="Anexar link do catálogo na primeira mensagem"
            />
          </div>
        </div>

        {/* Lead Management */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
            <div className="flex items-center gap-2">
              <Target className="w-5 h-5 text-gray-700" />
              <h2 className="text-lg font-bold text-gray-900">Gestão de Leads</h2>
            </div>
          </div>
          <div className="p-6 space-y-4">
            <ToggleSwitch
              checked={config.lead_auto_assign}
              onChange={(val) => handleChange('lead_auto_assign', val)}
              label="Atribuição automática de leads"
              description="Distribuir leads automaticamente entre vendedores"
            />

            <ToggleSwitch
              checked={config.auto_tag_leads}
              onChange={(val) => handleChange('auto_tag_leads', val)}
              label="Etiquetar leads automaticamente"
              description="Adicionar tags baseadas no comportamento"
            />

            <ToggleSwitch
              checked={config.lead_score_enabled}
              onChange={(val) => handleChange('lead_score_enabled', val)}
              label="Sistema de pontuação de leads"
              description="Calcular score baseado em engajamento"
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tempo de resposta alvo (min)
                </label>
                <input
                  type="number"
                  min="1"
                  value={config.lead_response_time_target}
                  onChange={(e) => handleChange('lead_response_time_target', parseInt(e.target.value))}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Lembrete de follow-up (h)
                </label>
                <input
                  type="number"
                  min="1"
                  value={config.follow_up_reminder_hours}
                  onChange={(e) => handleChange('follow_up_reminder_hours', parseInt(e.target.value))}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Máximo de tentativas
                </label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={config.max_lead_attempts}
                  onChange={(e) => handleChange('max_lead_attempts', parseInt(e.target.value))}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Notifications */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
            <div className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-gray-700" />
              <h2 className="text-lg font-bold text-gray-900">Notificações</h2>
            </div>
          </div>
          <div className="p-6 space-y-4">
            <ToggleSwitch
              checked={config.notify_new_inquiry}
              onChange={(val) => handleChange('notify_new_inquiry', val)}
              label="Notificar nova consulta"
              description="Receber alerta quando cliente enviar mensagem"
            />

            <ToggleSwitch
              checked={config.notify_abandoned_cart}
              onChange={(val) => handleChange('notify_abandoned_cart', val)}
              label="Notificar carrinho abandonado"
              description="Alertar sobre carrinhos não finalizados"
            />

            <ToggleSwitch
              checked={config.notify_low_stock}
              onChange={(val) => handleChange('notify_low_stock', val)}
              label="Notificar estoque baixo"
              description="Receber alerta de produtos com estoque mínimo"
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-200">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  E-mail para notificações
                </label>
                <input
                  type="email"
                  value={config.notification_email}
                  onChange={(e) => handleChange('notification_email', e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500"
                  placeholder="vendas@geezer.com.br"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  WhatsApp para notificações
                </label>
                <input
                  type="text"
                  value={config.notification_whatsapp}
                  onChange={(e) => handleChange('notification_whatsapp', e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500"
                  placeholder="+5511986751552"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Sales Targets */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-gray-700" />
              <h2 className="text-lg font-bold text-gray-900">Metas de Vendas</h2>
            </div>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Meta de contatos diários
                </label>
                <input
                  type="number"
                  min="0"
                  value={config.daily_contact_target}
                  onChange={(e) => handleChange('daily_contact_target', parseInt(e.target.value))}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500"
                />
                <p className="text-xs text-gray-500 mt-1">Número de contatos por dia</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Meta de vendas semanais
                </label>
                <input
                  type="number"
                  min="0"
                  value={config.weekly_sales_target}
                  onChange={(e) => handleChange('weekly_sales_target', parseInt(e.target.value))}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500"
                />
                <p className="text-xs text-gray-500 mt-1">Vendas fechadas por semana</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Taxa de conversão alvo (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={config.conversion_rate_target}
                  onChange={(e) => handleChange('conversion_rate_target', parseInt(e.target.value))}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500"
                />
                <p className="text-xs text-gray-500 mt-1">% de leads convertidos</p>
              </div>
            </div>
          </div>
        </div>

        {/* Save Button */}
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

        {/* Info Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
          <h3 className="font-bold text-blue-900 mb-2 flex items-center gap-2">
            <SettingsIcon className="w-5 h-5" />
            Sobre as Configurações SDR
          </h3>
          <p className="text-sm text-blue-800">
            As configurações de SDR (Sales Development Representative) permitem automatizar e otimizar
            o processo de vendas. Configure automações, defina metas e gerencie notificações para
            melhorar a conversão de leads em clientes.
          </p>
        </div>
      </div>
    </div>
  );
}
