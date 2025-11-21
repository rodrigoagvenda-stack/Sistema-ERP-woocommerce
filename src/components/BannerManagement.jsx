import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { toast } from 'react-toastify';
import { Upload, Image as ImageIcon, X, Eye, EyeOff, Plus, Edit2, Trash2, Save, Monitor, Tablet, Smartphone } from 'lucide-react';

const BannerManagement = () => {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingBanner, setEditingBanner] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    link_url: '',
    button_text: '',
    is_active: true,
    order_index: 0,
    start_date: '',
    end_date: ''
  });

  // Upload state
  const [uploads, setUploads] = useState({
    desktop: { file: null, preview: null, uploading: false },
    tablet: { file: null, preview: null, uploading: false },
    mobile: { file: null, preview: null, uploading: false }
  });

  // Image URL state (for editing existing banners)
  const [imageUrls, setImageUrls] = useState({
    desktop: '',
    tablet: '',
    mobile: ''
  });

  // Dimensões recomendadas
  const DIMENSIONS = {
    desktop: { width: 1920, height: 600, label: 'Desktop' },
    tablet: { width: 1024, height: 500, label: 'Tablet' },
    mobile: { width: 768, height: 400, label: 'Mobile' }
  };

  useEffect(() => {
    fetchBanners();
  }, []);

  const fetchBanners = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('banners')
        .select('*')
        .order('order_index', { ascending: true });

      if (error) throw error;
      setBanners(data || []);
    } catch (error) {
      console.error('Erro ao carregar banners:', error);
      toast.error('❌ Erro ao carregar banners');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (format, e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tipo de arquivo
    if (!file.type.startsWith('image/')) {
      toast.error(`❌ Por favor, selecione uma imagem válida para ${DIMENSIONS[format].label}`);
      return;
    }

    // Validar tamanho (máximo 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error(`❌ A imagem ${DIMENSIONS[format].label} deve ter no máximo 5MB`);
      return;
    }

    // Criar preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setUploads(prev => ({
        ...prev,
        [format]: { file, preview: reader.result, uploading: false }
      }));
    };
    reader.readAsDataURL(file);

    // Validar dimensões da imagem
    const img = new Image();
    img.onload = () => {
      const recommended = DIMENSIONS[format];
      if (img.width !== recommended.width || img.height !== recommended.height) {
        toast.warning(`⚠️ Dimensões recomendadas para ${recommended.label}: ${recommended.width}x${recommended.height}px. Sua imagem: ${img.width}x${img.height}px`);
      }
    };
    img.src = URL.createObjectURL(file);
  };

  const uploadImage = async (format, file) => {
    try {
      setUploads(prev => ({
        ...prev,
        [format]: { ...prev[format], uploading: true }
      }));

      const fileExt = file.name.split('.').pop();
      const fileName = `${format}_${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError, data } = await supabase.storage
        .from('banners')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      // Obter URL pública
      const { data: { publicUrl } } = supabase.storage
        .from('banners')
        .getPublicUrl(filePath);

      setImageUrls(prev => ({
        ...prev,
        [format]: publicUrl
      }));

      toast.success(`✅ Imagem ${DIMENSIONS[format].label} enviada com sucesso!`);
      return publicUrl;

    } catch (error) {
      console.error(`Erro ao fazer upload ${format}:`, error);
      toast.error(`❌ Erro ao enviar imagem ${DIMENSIONS[format].label}`);
      throw error;
    } finally {
      setUploads(prev => ({
        ...prev,
        [format]: { ...prev[format], uploading: false }
      }));
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (format, e) => {
    e.preventDefault();
    e.stopPropagation();

    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const fakeEvent = { target: { files: [file] } };
      handleFileChange(format, fakeEvent);
    }
  };

  const removeImage = (format) => {
    setUploads(prev => ({
      ...prev,
      [format]: { file: null, preview: null, uploading: false }
    }));
    setImageUrls(prev => ({
      ...prev,
      [format]: ''
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validações
    if (!formData.title.trim()) {
      toast.warning('⚠️ Título é obrigatório');
      return;
    }

    // Verificar se tem pelo menos uma imagem
    const hasDesktopImage = uploads.desktop.file || imageUrls.desktop;
    if (!hasDesktopImage) {
      toast.warning('⚠️ É necessário fazer upload da imagem Desktop');
      return;
    }

    setSaving(true);
    try {
      // Upload das imagens
      let desktopUrl = imageUrls.desktop;
      let tabletUrl = imageUrls.tablet;
      let mobileUrl = imageUrls.mobile;

      if (uploads.desktop.file) {
        desktopUrl = await uploadImage('desktop', uploads.desktop.file);
      }
      if (uploads.tablet.file) {
        tabletUrl = await uploadImage('tablet', uploads.tablet.file);
      }
      if (uploads.mobile.file) {
        mobileUrl = await uploadImage('mobile', uploads.mobile.file);
      }

      // Preparar dados do banner
      const bannerData = {
        ...formData,
        image_url: desktopUrl, // Compatibilidade com campo antigo
        image_url_desktop: desktopUrl,
        image_url_tablet: tabletUrl || null,
        image_url_mobile: mobileUrl || null,
        start_date: formData.start_date || null,
        end_date: formData.end_date || null
      };

      if (editingBanner) {
        // Atualizar
        const { error } = await supabase
          .from('banners')
          .update(bannerData)
          .eq('id', editingBanner.id);

        if (error) throw error;
        toast.success('✅ Banner atualizado com sucesso!');
      } else {
        // Criar
        const { error } = await supabase
          .from('banners')
          .insert([bannerData]);

        if (error) throw error;
        toast.success('✅ Banner criado com sucesso!');
      }

      // Resetar form
      resetForm();
      fetchBanners();
      setShowForm(false);

    } catch (error) {
      console.error('Erro ao salvar banner:', error);
      toast.error('❌ Erro ao salvar banner: ' + (error.message || 'Erro desconhecido'));
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      link_url: '',
      button_text: '',
      is_active: true,
      order_index: 0,
      start_date: '',
      end_date: ''
    });
    setUploads({
      desktop: { file: null, preview: null, uploading: false },
      tablet: { file: null, preview: null, uploading: false },
      mobile: { file: null, preview: null, uploading: false }
    });
    setImageUrls({ desktop: '', tablet: '', mobile: '' });
    setEditingBanner(null);
  };

  const editBanner = (banner) => {
    setEditingBanner(banner);
    setFormData({
      title: banner.title || '',
      description: banner.description || '',
      link_url: banner.link_url || '',
      button_text: banner.button_text || '',
      is_active: banner.is_active,
      order_index: banner.order_index || 0,
      start_date: banner.start_date ? banner.start_date.split('T')[0] : '',
      end_date: banner.end_date ? banner.end_date.split('T')[0] : ''
    });
    setImageUrls({
      desktop: banner.image_url_desktop || banner.image_url || '',
      tablet: banner.image_url_tablet || '',
      mobile: banner.image_url_mobile || ''
    });
    setShowForm(true);
  };

  const deleteBanner = async (id) => {
    if (!confirm('Tem certeza que deseja deletar este banner?')) return;

    try {
      const { error } = await supabase
        .from('banners')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('✅ Banner deletado com sucesso!');
      fetchBanners();
    } catch (error) {
      console.error('Erro ao deletar banner:', error);
      toast.error('❌ Erro ao deletar banner');
    }
  };

  const toggleActive = async (banner) => {
    try {
      const { error } = await supabase
        .from('banners')
        .update({ is_active: !banner.is_active })
        .eq('id', banner.id);

      if (error) throw error;
      toast.success(`✅ Banner ${!banner.is_active ? 'ativado' : 'desativado'} com sucesso!`);
      fetchBanners();
    } catch (error) {
      console.error('Erro ao alternar status:', error);
      toast.error('❌ Erro ao alterar status do banner');
    }
  };

  const UploadBox = ({ format, icon: Icon }) => {
    const { file, preview, uploading } = uploads[format];
    const existingUrl = imageUrls[format];
    const dim = DIMENSIONS[format];

    return (
      <div className="bg-white rounded-lg p-4 border-2 border-dashed border-gray-300 hover:border-yellow-500 transition-colors">
        <div className="flex items-center gap-2 mb-3">
          <Icon size={20} className="text-gray-600" />
          <h3 className="font-semibold text-gray-800">{dim.label}</h3>
          <span className="text-xs text-gray-500">({dim.width}x{dim.height})</span>
        </div>

        {preview || existingUrl ? (
          <div className="relative">
            <img
              src={preview || existingUrl}
              alt={`Preview ${dim.label}`}
              className="w-full h-32 object-cover rounded-lg"
            />
            <button
              type="button"
              onClick={() => removeImage(format)}
              className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
            >
              <X size={16} />
            </button>
            {uploading && (
              <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-lg">
                <div className="text-white">Enviando...</div>
              </div>
            )}
          </div>
        ) : (
          <div
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(format, e)}
            className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-yellow-500 cursor-pointer"
          >
            <input
              type="file"
              accept="image/*"
              onChange={(e) => handleFileChange(format, e)}
              className="hidden"
              id={`upload-${format}`}
            />
            <label htmlFor={`upload-${format}`} className="cursor-pointer">
              <Upload className="mx-auto mb-2 text-gray-400" size={32} />
              <p className="text-sm text-gray-600">Clique ou arraste a imagem aqui</p>
              <p className="text-xs text-gray-400 mt-1">PNG, JPG até 5MB</p>
            </label>
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-600">Carregando banners...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">📸 Gestão de Banners</h1>
          <p className="text-gray-600 mt-1">Gerencie os banners do catálogo com imagens responsivas</p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowForm(!showForm);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg font-medium transition-colors"
        >
          <Plus size={20} />
          Novo Banner
        </button>
      </div>

      {/* Formulário */}
      {showForm && (
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">
            {editingBanner ? '✏️ Editar Banner' : '➕ Novo Banner'}
          </h2>

          <form onSubmit={handleSubmit}>
            {/* Upload de Imagens */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <UploadBox format="desktop" icon={Monitor} />
              <UploadBox format="tablet" icon={Tablet} />
              <UploadBox format="mobile" icon={Smartphone} />
            </div>

            {/* Campos do formulário */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Título *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                  placeholder="Ex: Coleção Verão 2025"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Texto do Botão
                </label>
                <input
                  type="text"
                  value={formData.button_text}
                  onChange={(e) => setFormData({ ...formData, button_text: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                  placeholder="Ex: Ver Coleção"
                />
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Descrição
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                rows={3}
                placeholder="Descrição do banner..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Link (URL)
                </label>
                <input
                  type="url"
                  value={formData.link_url}
                  onChange={(e) => setFormData({ ...formData, link_url: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                  placeholder="https://..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Data Início
                </label>
                <input
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Data Fim
                </label>
                <input
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ordem de Exibição
                </label>
                <input
                  type="number"
                  value={formData.order_index}
                  onChange={(e) => setFormData({ ...formData, order_index: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                />
              </div>

              <div className="flex items-center pt-8">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="w-5 h-5 text-yellow-500 rounded focus:ring-yellow-500"
                  />
                  <span className="ml-2 text-gray-700 font-medium">Banner Ativo</span>
                </label>
              </div>
            </div>

            {/* Botões */}
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 px-6 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg font-medium disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                <Save size={20} />
                {saving ? 'Salvando...' : editingBanner ? 'Atualizar Banner' : 'Criar Banner'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  resetForm();
                }}
                className="px-6 py-2 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded-lg font-medium transition-colors"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Lista de Banners */}
      <div className="grid grid-cols-1 gap-4">
        {banners.length === 0 ? (
          <div className="bg-gray-50 rounded-xl p-12 text-center">
            <ImageIcon size={48} className="mx-auto mb-4 text-gray-400" />
            <p className="text-gray-600 mb-2">Nenhum banner cadastrado</p>
            <p className="text-sm text-gray-500">Clique em "Novo Banner" para começar</p>
          </div>
        ) : (
          banners.map((banner) => (
            <div
              key={banner.id}
              className={`bg-white rounded-xl shadow-md overflow-hidden ${
                !banner.is_active ? 'opacity-60' : ''
              }`}
            >
              <div className="md:flex">
                {/* Imagem Desktop */}
                <div className="md:w-1/3">
                  <img
                    src={banner.image_url_desktop || banner.image_url}
                    alt={banner.title}
                    className="w-full h-48 object-cover"
                  />
                </div>

                {/* Informações */}
                <div className="p-6 md:w-2/3">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-gray-800 mb-1">{banner.title}</h3>
                      <p className="text-gray-600 text-sm">{banner.description}</p>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        banner.is_active
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {banner.is_active ? '✓ Ativo' : '✗ Inativo'}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 mb-4 text-xs text-gray-600">
                    <div>
                      <Monitor size={14} className="inline mr-1" />
                      {banner.image_url_desktop ? '✓' : '✗'} Desktop
                    </div>
                    <div>
                      <Tablet size={14} className="inline mr-1" />
                      {banner.image_url_tablet ? '✓' : '✗'} Tablet
                    </div>
                    <div>
                      <Smartphone size={14} className="inline mr-1" />
                      {banner.image_url_mobile ? '✓' : '✗'} Mobile
                    </div>
                  </div>

                  {/* Botões de ação */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => editBanner(banner)}
                      className="flex items-center gap-1 px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm transition-colors"
                    >
                      <Edit2 size={14} />
                      Editar
                    </button>
                    <button
                      onClick={() => toggleActive(banner)}
                      className="flex items-center gap-1 px-3 py-1.5 bg-gray-500 hover:bg-gray-600 text-white rounded-lg text-sm transition-colors"
                    >
                      {banner.is_active ? <EyeOff size={14} /> : <Eye size={14} />}
                      {banner.is_active ? 'Desativar' : 'Ativar'}
                    </button>
                    <button
                      onClick={() => deleteBanner(banner.id)}
                      className="flex items-center gap-1 px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm transition-colors"
                    >
                      <Trash2 size={14} />
                      Deletar
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default BannerManagement;
