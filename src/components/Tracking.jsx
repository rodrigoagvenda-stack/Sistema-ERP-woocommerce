import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { toast } from 'react-toastify';
import {
  TrendingUp,
  Eye,
  Users,
  Globe,
  Smartphone,
  Monitor,
  Tablet,
  Loader,
  BarChart3,
  Link as LinkIcon,
  Calendar
} from 'lucide-react';

export default function Tracking() {
  const [dateRange, setDateRange] = useState('7days');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState({
    totalVisits: 0,
    uniqueSessions: 0,
    topSources: [],
    topCampaigns: [],
    topReferrers: [],
    deviceBreakdown: [],
    visitsByDate: []
  });

  useEffect(() => {
    loadAnalytics();
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
      startDate = new Date(now.setDate(now.getDate() - 7));
      endDate = new Date();
    }

    return { startDate, endDate };
  };

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const { startDate, endDate } = getDateRange();

      // Buscar visitas do período
      const { data: visits, error } = await supabase
        .from('page_visits')
        .select('*')
        .gte('visited_at', startDate.toISOString())
        .lte('visited_at', endDate.toISOString());

      if (error) {
        console.error('Erro ao carregar tracking:', error);
        // Se a tabela não existe, mostrar dados vazios
        setAnalytics({
          totalVisits: 0,
          uniqueSessions: 0,
          topSources: [],
          topCampaigns: [],
          topReferrers: [],
          deviceBreakdown: [],
          visitsByDate: []
        });
        setLoading(false);
        return;
      }

      // Calcular métricas
      const totalVisits = visits?.length || 0;
      const uniqueSessions = new Set(visits?.map(v => v.session_id) || []).size;

      // Top UTM Sources
      const sourceCounts = {};
      visits?.forEach(v => {
        if (v.utm_source) {
          sourceCounts[v.utm_source] = (sourceCounts[v.utm_source] || 0) + 1;
        }
      });
      const topSources = Object.entries(sourceCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([source, count]) => ({ source, count }));

      // Top Campaigns
      const campaignCounts = {};
      visits?.forEach(v => {
        if (v.utm_campaign) {
          campaignCounts[v.utm_campaign] = (campaignCounts[v.utm_campaign] || 0) + 1;
        }
      });
      const topCampaigns = Object.entries(campaignCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([campaign, count]) => ({ campaign, count }));

      // Top Referrers
      const referrerCounts = {};
      visits?.forEach(v => {
        if (v.referrer && v.referrer !== '') {
          try {
            const url = new URL(v.referrer);
            const domain = url.hostname;
            referrerCounts[domain] = (referrerCounts[domain] || 0) + 1;
          } catch (e) {
            // Referrer inválido
          }
        }
      });
      const topReferrers = Object.entries(referrerCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([referrer, count]) => ({ referrer, count }));

      // Device Breakdown
      const deviceCounts = { mobile: 0, tablet: 0, desktop: 0, unknown: 0 };
      visits?.forEach(v => {
        const device = v.device_type || 'unknown';
        deviceCounts[device] = (deviceCounts[device] || 0) + 1;
      });
      const deviceBreakdown = Object.entries(deviceCounts)
        .filter(([_, count]) => count > 0)
        .map(([device, count]) => ({ device, count }));

      // Visits by Date
      const visitsByDate = {};
      visits?.forEach(v => {
        const date = new Date(v.visited_at).toLocaleDateString('pt-BR');
        visitsByDate[date] = (visitsByDate[date] || 0) + 1;
      });

      setAnalytics({
        totalVisits,
        uniqueSessions,
        topSources,
        topCampaigns,
        topReferrers,
        deviceBreakdown,
        visitsByDate: Object.entries(visitsByDate).sort((a, b) => new Date(a[0]) - new Date(b[0]))
      });
    } catch (error) {
      console.error('Erro ao carregar analytics:', error);
      toast.error('❌ Erro ao carregar dados de tracking');
    } finally {
      setLoading(false);
    }
  };

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

  const getDeviceIcon = (device) => {
    switch (device) {
      case 'mobile': return <Smartphone className="w-5 h-5 text-blue-600" />;
      case 'tablet': return <Tablet className="w-5 h-5 text-purple-600" />;
      case 'desktop': return <Monitor className="w-5 h-5 text-green-600" />;
      default: return <Globe className="w-5 h-5 text-gray-600" />;
    }
  };

  const getDeviceLabel = (device) => {
    switch (device) {
      case 'mobile': return 'Mobile';
      case 'tablet': return 'Tablet';
      case 'desktop': return 'Desktop';
      default: return 'Desconhecido';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader className="w-8 h-8 animate-spin text-yellow-500" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 bg-blue-100 rounded-lg">
              <TrendingUp className="w-7 h-7 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Tracking e Analytics</h1>
              <p className="text-sm text-gray-600">Monitore suas fontes de tráfego e UTMs</p>
            </div>
          </div>
        </div>

        {/* Filtro de Data */}
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
              />
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 text-sm"
              />
            </div>
          )}
        </div>
      </div>

      {/* Cards de Métricas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        <MetricCard
          title="Total de Visitas"
          value={analytics.totalVisits}
          icon={<Eye className="w-8 h-8 text-blue-500" />}
          bgColor="bg-blue-50"
          subtitle="No período selecionado"
        />
        <MetricCard
          title="Sessões Únicas"
          value={analytics.uniqueSessions}
          icon={<Users className="w-8 h-8 text-green-500" />}
          bgColor="bg-green-50"
          subtitle="Visitantes únicos"
        />
        <MetricCard
          title="Taxa de Conversão"
          value={analytics.uniqueSessions > 0 ? `${((analytics.totalVisits / analytics.uniqueSessions) * 100).toFixed(1)}%` : '0%'}
          icon={<TrendingUp className="w-8 h-8 text-purple-500" />}
          bgColor="bg-purple-50"
          subtitle="Visitas por sessão"
        />
      </div>

      {/* Grid de Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top UTM Sources */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center gap-2 mb-4">
            <Globe className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-bold text-gray-800">Top UTM Sources</h2>
          </div>

          {analytics.topSources.length > 0 ? (
            <div className="space-y-3">
              {analytics.topSources.map((item, index) => (
                <div key={item.source} className="flex items-center gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                    <span className="text-sm font-bold text-blue-600">#{index + 1}</span>
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-800">{item.source}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-blue-600">{item.count}</p>
                    <p className="text-xs text-gray-500">visitas</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Globe className="w-12 h-12 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-500">Nenhum dado de UTM source</p>
              <p className="text-xs text-gray-400 mt-1">Use parâmetros ?utm_source=fonte nas URLs</p>
            </div>
          )}
        </div>

        {/* Top Campaigns */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="w-6 h-6 text-purple-600" />
            <h2 className="text-xl font-bold text-gray-800">Top Campanhas</h2>
          </div>

          {analytics.topCampaigns.length > 0 ? (
            <div className="space-y-3">
              {analytics.topCampaigns.map((item, index) => (
                <div key={item.campaign} className="flex items-center gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                    <span className="text-sm font-bold text-purple-600">#{index + 1}</span>
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-800">{item.campaign}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-purple-600">{item.count}</p>
                    <p className="text-xs text-gray-500">visitas</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <BarChart3 className="w-12 h-12 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-500">Nenhuma campanha rastreada</p>
              <p className="text-xs text-gray-400 mt-1">Use parâmetros ?utm_campaign=nome nas URLs</p>
            </div>
          )}
        </div>

        {/* Top Referrers */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center gap-2 mb-4">
            <LinkIcon className="w-6 h-6 text-green-600" />
            <h2 className="text-xl font-bold text-gray-800">Top Referrers</h2>
          </div>

          {analytics.topReferrers.length > 0 ? (
            <div className="space-y-3">
              {analytics.topReferrers.map((item, index) => (
                <div key={item.referrer} className="flex items-center gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                    <span className="text-sm font-bold text-green-600">#{index + 1}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-800 text-sm truncate">{item.referrer}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-green-600">{item.count}</p>
                    <p className="text-xs text-gray-500">visitas</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <LinkIcon className="w-12 h-12 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-500">Nenhum referrer detectado</p>
              <p className="text-xs text-gray-400 mt-1">Visitantes diretos ou sem referrer</p>
            </div>
          )}
        </div>

        {/* Device Breakdown */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center gap-2 mb-4">
            <Smartphone className="w-6 h-6 text-orange-600" />
            <h2 className="text-xl font-bold text-gray-800">Dispositivos</h2>
          </div>

          {analytics.deviceBreakdown.length > 0 ? (
            <div className="space-y-4">
              {analytics.deviceBreakdown.map((item) => (
                <div key={item.device}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {getDeviceIcon(item.device)}
                      <span className="font-semibold text-gray-800">{getDeviceLabel(item.device)}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-lg font-bold text-gray-800">{item.count}</span>
                      <span className="text-xs text-gray-500 ml-1">
                        ({analytics.totalVisits > 0 ? ((item.count / analytics.totalVisits) * 100).toFixed(1) : 0}%)
                      </span>
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        item.device === 'mobile' ? 'bg-blue-500' :
                        item.device === 'tablet' ? 'bg-purple-500' :
                        item.device === 'desktop' ? 'bg-green-500' : 'bg-gray-500'
                      }`}
                      style={{ width: `${analytics.totalVisits > 0 ? (item.count / analytics.totalVisits) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Smartphone className="w-12 h-12 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-500">Nenhum dado de dispositivo</p>
            </div>
          )}
        </div>
      </div>

      {/* Gráfico de Visitas por Dia */}
      {analytics.visitsByDate.length > 0 && (
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="w-6 h-6 text-yellow-600" />
            <h2 className="text-xl font-bold text-gray-800">Visitas por Dia</h2>
          </div>
          <div className="space-y-2">
            {analytics.visitsByDate.map(([date, count]) => (
              <div key={date} className="flex items-center gap-4">
                <span className="text-sm text-gray-600 w-24">{date}</span>
                <div className="flex-1 bg-gray-200 rounded-full h-6 overflow-hidden">
                  <div
                    className="bg-yellow-500 h-full flex items-center justify-end pr-2 rounded-full transition-all"
                    style={{ width: `${(count / Math.max(...analytics.visitsByDate.map(v => v[1]))) * 100}%` }}
                  >
                    <span className="text-xs font-bold text-white">{count}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Info sobre UTM Parameters */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
        <h3 className="font-bold text-blue-900 mb-2">💡 Como usar UTM Parameters</h3>
        <p className="text-sm text-blue-800 mb-3">
          Adicione estes parâmetros às suas URLs para rastrear a origem do tráfego:
        </p>
        <div className="bg-white rounded-lg p-4 font-mono text-xs text-gray-700">
          <p className="mb-1">?utm_source=<span className="text-blue-600">facebook</span></p>
          <p className="mb-1">&amp;utm_medium=<span className="text-purple-600">social</span></p>
          <p className="mb-1">&amp;utm_campaign=<span className="text-green-600">promo_verao</span></p>
          <p className="mb-1">&amp;utm_term=<span className="text-orange-600">vestido</span></p>
          <p>&amp;utm_content=<span className="text-pink-600">banner_top</span></p>
        </div>
        <p className="text-xs text-blue-600 mt-3">
          <strong>Exemplo completo:</strong> https://geezer.agenciavenda.com.br?utm_source=instagram&amp;utm_medium=stories&amp;utm_campaign=lancamento
        </p>
      </div>
    </div>
  );
}
