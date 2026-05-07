import { useState } from 'react'
import { ChevronDown, Globe, MessageCircle, BookOpen, HelpCircle, Copy, RefreshCw, Download, FlaskConical } from 'lucide-react'
import { cn } from '@/lib/utils'

/* ─── Data ──────────────────────────────────────────────────── */
const guides = [
  {
    title: 'Configurar a integração com o WooCommerce',
    steps: [
      'Acesse WooCommerce → Configurações no menu lateral.',
      'No painel do WordPress, vá em WooCommerce → Configurações → Avançado → API REST.',
      'Clique em "Adicionar chave", dê um nome, selecione permissão de Leitura/Escrita e clique em "Gerar chave de API".',
      'Copie a Consumer Key e a Consumer Secret geradas.',
      'Cole as duas chaves no ERP (campo URL da loja + Consumer Key + Consumer Secret) e salve.',
      'Se aparecer "Conexão OK" ou os dados carregarem no Dashboard, a integração está ativa.',
    ],
  },
  {
    title: 'Importar categorias do WooCommerce',
    steps: [
      'Vá em Produtos → Categorias.',
      'Clique em "Importar do Woo" no canto superior direito.',
      'O sistema buscará todas as categorias cadastradas no WooCommerce (incluindo subcategorias) e as importará automaticamente.',
      'Categorias já importadas serão ignoradas — não haverá duplicatas.',
      'Após a importação, cada categoria exibirá seu Woo ID, confirmando o vínculo.',
    ],
  },
  {
    title: 'Criar categorias e subcategorias manualmente',
    steps: [
      'Vá em Produtos → Categorias e clique em "+ Nova Categoria".',
      'Crie primeiro as categorias PAI (ex: "Cervejas Artesanais"). Salve.',
      'Clique no botão globo da categoria para sincronizar com o WooCommerce. Aguarde o Woo ID aparecer.',
      'Agora crie as subcategorias: clique em "+ Nova Categoria", preencha o nome e selecione a categoria pai.',
      'Salve e clique no globo para sincronizar a subcategoria.',
      'Repita para todas as subcategorias necessárias.',
    ],
  },
  {
    title: 'Criar estilos de cerveja',
    steps: [
      'Vá em Produtos → Estilos e clique em "+ Novo Estilo".',
      'Preencha o nome do estilo (ex: "IPA", "Stout", "Witbier") e salve.',
      'Os estilos ficam disponíveis como atributo "Estilo" ao criar ou editar produtos.',
      'Ao sincronizar um produto com estilo definido, o WooCommerce receberá o atributo automaticamente.',
      'Para remover um estilo, o campo será limpo nos produtos que o usavam.',
    ],
  },
  {
    title: 'Importar produtos do WooCommerce',
    steps: [
      'Antes de importar produtos, importe as categorias para que o vínculo seja feito corretamente.',
      'Vá em Produtos e clique em "Importar do Woo".',
      'O sistema buscará todos os produtos do WooCommerce (paginado, sem limite de quantidade).',
      'Cada produto terá nome, preço, estoque, categoria, estilo, imagens e dimensões preenchidos automaticamente.',
      'Produtos já importados (com Woo ID) são ignorados — não haverá duplicatas.',
      'Após a importação, os produtos aparecem na listagem prontos para uso.',
    ],
  },
  {
    title: 'Criar marcas',
    steps: [
      'Vá em Produtos → Marcas e clique em "+ Nova Marca".',
      'Preencha o nome e o slug da marca.',
      'Salve e clique no globo para sincronizar com o WooCommerce como atributo global "Marca".',
    ],
  },
  {
    title: 'Criar e sincronizar produtos manualmente',
    steps: [
      'Vá em Produtos → clique em "+ Novo Produto".',
      'Passo 1 (Básico): preencha nome, preço, estoque e status.',
      'Passo 2 (Detalhes): selecione categoria, subcategoria, marca e estilo.',
      'Passo 3 (Mídia): faça upload da imagem principal e das fotos da galeria. Preencha dimensões e peso se necessário.',
      'Clique em "Criar Produto" para salvar no ERP.',
      'Clique no botão globo para enviar o produto ao WooCommerce.',
    ],
  },
  {
    title: 'Sincronizar todos os produtos de uma vez',
    steps: [
      'Vá em Produtos.',
      'Se houver produtos ativos sem Woo ID, o botão "Sync todos (N)" aparecerá no canto superior direito.',
      'Clique nele para enviar todos os produtos não sincronizados ao WooCommerce de uma só vez.',
      'Ao final, um resumo mostrará quantos foram enviados e quantos tiveram erro.',
    ],
  },
  {
    title: 'Duplicar um produto',
    steps: [
      'Na listagem de produtos, clique no ícone de cópia ao lado do produto desejado.',
      'Um clone será criado com o nome "(cópia)" e status Inativo.',
      'O clone não possui Woo ID — edite-o e sincronize quando estiver pronto.',
      'Útil para criar variações de um mesmo produto sem precisar preencher tudo do zero.',
    ],
  },
]

const faqs = [
  {
    section: 'Login e Acesso',
    items: [
      {
        q: 'Como faço login no sistema?',
        a: 'Acesse a página de login, insira seu e-mail e senha cadastrados e clique em "Entrar". Em caso de erro, verifique se as credenciais estão corretas.',
      },
      {
        q: 'Esqueci minha senha, o que faço?',
        a: 'Entre em contato com o administrador do sistema para redefinição de senha no painel do Supabase (Authentication → Users).',
      },
    ],
  },
  {
    section: 'Dashboard',
    items: [
      {
        q: 'O que é exibido no Dashboard?',
        a: 'Um resumo geral: total de produtos, categorias, marcas, tags, pedidos recentes, receita e indicadores de estoque baixo.',
      },
      {
        q: 'Os dados são em tempo real?',
        a: 'Sim. Os pedidos e dados de analytics são buscados diretamente do WooCommerce via a integração ativa.',
      },
    ],
  },
  {
    section: 'Categorias',
    items: [
      {
        q: 'Qual a diferença entre categoria e subcategoria?',
        a: 'Subcategoria é simplesmente uma categoria com uma "categoria pai" definida. O ERP cuida disso automaticamente quando você preenche o campo "Categoria Pai" ao criar.',
      },
      {
        q: 'Por que sincronizar categorias antes dos produtos?',
        a: 'O WooCommerce usa um ID numérico próprio (Woo ID) para vincular categorias a produtos. Se a categoria não tiver Woo ID, o produto não consegue ser vinculado a ela. Sempre sincronize categorias antes dos produtos.',
      },
      {
        q: 'Posso importar categorias direto do WooCommerce?',
        a: 'Sim. Em Produtos → Categorias, clique em "Importar do Woo". O sistema importa todas as categorias (incluindo hierarquia pai/filho) de uma vez. Categorias já cadastradas são ignoradas automaticamente.',
      },
      {
        q: 'O que acontece ao deletar uma categoria?',
        a: 'A categoria é removida do ERP e também do WooCommerce (via DELETE com force=true). Os produtos vinculados perdem a referência de categoria — recomendamos reatribuí-los antes de deletar.',
      },
      {
        q: 'Posso adicionar imagem à categoria?',
        a: 'Sim. Ao criar ou editar uma categoria, há um campo de upload de imagem. A imagem é enviada ao WooCommerce automaticamente na sincronização.',
      },
    ],
  },
  {
    section: 'Estilos',
    items: [
      {
        q: 'O que são os Estilos?',
        a: 'Estilos são tipos de cerveja (ex: IPA, Stout, Pilsen). São cadastrados em Produtos → Estilos e ficam disponíveis como atributo nos produtos. No WooCommerce, são enviados como o atributo "Estilo".',
      },
      {
        q: 'Como criar um novo estilo?',
        a: 'Vá em Produtos → Estilos, clique em "+ Novo Estilo", preencha o nome e salve. O estilo estará disponível imediatamente no formulário de produtos.',
      },
      {
        q: 'O que acontece ao deletar um estilo?',
        a: 'O campo "estilo" é limpo em todos os produtos que usavam esse estilo. A ação não pode ser desfeita.',
      },
    ],
  },
  {
    section: 'Produtos',
    items: [
      {
        q: 'Como criar um novo produto?',
        a: 'Vá em Produtos → "+ Novo Produto", preencha os campos nas 3 etapas (Básico, Detalhes, Mídia) e clique em "Criar Produto". Após criar, clique no botão globo para enviar ao WooCommerce.',
      },
      {
        q: 'Como filtrar os produtos na listagem?',
        a: 'Use a barra de busca para pesquisar por nome. Filtre por categoria usando o seletor ao lado da busca. Use as pills rápidas para ver Todos, Ativos, Inativos ou apenas produtos com Estoque crítico.',
      },
      {
        q: 'O que é o Estoque crítico?',
        a: 'Produtos cujo estoque atual está abaixo do Estoque Mínimo definido. Ficam destacados na listagem com fundo âmbar e contados na pill "⚠️ Estoque crítico". O subtítulo da página também exibe a contagem.',
      },
      {
        q: 'Como duplicar um produto?',
        a: 'Clique no ícone de cópia na linha do produto. Um clone é criado com status Inativo e sem Woo ID. Edite o clone e sincronize quando estiver pronto. Útil para produtos similares.',
      },
      {
        q: 'Como sincronizar todos os produtos de uma vez?',
        a: 'Se houver produtos ativos sem Woo ID, o botão "Sync todos (N)" aparece no header da página. Clique nele para enviar todos de uma só vez.',
      },
      {
        q: 'Posso importar produtos do WooCommerce?',
        a: 'Sim. Clique em "Importar do Woo" na página de Produtos. O sistema busca todos os produtos (em lotes de 100), mapeia categorias, estilos e imagens automaticamente. Produtos já importados não são duplicados.',
      },
      {
        q: 'O que significa "não sincronizado" no nome do produto?',
        a: 'Significa que o produto está Ativo no ERP mas ainda não foi enviado ao WooCommerce (sem Woo ID). Clique no globo ou use o "Sync todos" para sincronizá-lo.',
      },
      {
        q: 'Como sincronizar um produto com o WooCommerce?',
        a: 'Clique no botão globo ao lado do produto. Se ainda não existe no WooCommerce, será criado. Se já existe, será atualizado. O ícone fica verde quando sincronizado.',
      },
      {
        q: 'Criei o produto mas ele não aparece na loja, o que fazer?',
        a: 'Certifique-se de ter clicado no globo para sincronizar. Verifique se o produto está "Ativo" e se as credenciais do WooCommerce estão corretas nos Logs de Sync.',
      },
      {
        q: 'Ao excluir um produto, ele some da loja também?',
        a: 'Sim. Se o produto tiver Woo ID, ele é deletado do WooCommerce com force=true (remoção permanente, não vai para a lixeira) antes de ser removido do ERP.',
      },
    ],
  },
  {
    section: 'Analytics',
    items: [
      {
        q: 'O que está disponível em Analytics?',
        a: 'Visão Geral, Produtos mais vendidos, Receita por período, Pedidos, Variações, Categorias e Estoque.',
      },
      {
        q: 'Como configurar metas de receita?',
        a: 'Vá em Analytics → Configurações. Lá você pode definir meta de receita, período padrão e limiar de estoque baixo.',
      },
    ],
  },
  {
    section: 'WooCommerce',
    items: [
      {
        q: 'Como configurar a integração?',
        a: 'Vá em WooCommerce → Configurações. Insira a URL da loja, Consumer Key e Consumer Secret geradas no WordPress (WooCommerce → Avançado → API REST).',
      },
      {
        q: 'O que são os Logs de Sync?',
        a: 'Registram todas as operações de sincronização entre o ERP e o WooCommerce: criações, atualizações e erros. Útil para diagnosticar falhas.',
      },
      {
        q: 'O que fazer quando a sincronização falha?',
        a: 'Verifique os Logs de Sync para ver o erro detalhado. Causas mais comuns: credenciais incorretas, categoria sem Woo ID ou conexão instável.',
      },
    ],
  },
]

/* ─── Components ────────────────────────────────────────────── */
function GuideItem({ guide, index }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border-b border-gray-100 last:border-0">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between gap-4 py-4 text-left group"
      >
        <div className="flex items-center gap-3">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#15A344]/10 text-xs font-semibold text-[#15A344]">
            {index + 1}
          </span>
          <span className="text-sm font-medium text-gray-800 group-hover:text-gray-900">{guide.title}</span>
        </div>
        <ChevronDown className={cn('h-4 w-4 shrink-0 text-gray-400 transition-transform duration-200', open && 'rotate-180')} />
      </button>
      {open && (
        <ol className="mb-4 ml-9 space-y-2.5">
          {guide.steps.map((step, i) => (
            <li key={i} className="flex items-start gap-2.5 text-sm text-gray-500 leading-relaxed">
              <span className="mt-0.5 text-[#15A344] font-medium shrink-0">{i + 1}.</span>
              {step}
            </li>
          ))}
        </ol>
      )}
    </div>
  )
}

function FAQItem({ item }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border-b border-gray-100 last:border-0">
      <button
        className="w-full flex items-center justify-between gap-4 py-3.5 text-left group"
        onClick={() => setOpen(!open)}
      >
        <span className="text-sm text-gray-700 group-hover:text-gray-900">{item.q}</span>
        <ChevronDown className={cn('h-4 w-4 shrink-0 text-gray-400 transition-transform duration-200', open && 'rotate-180')} />
      </button>
      {open && (
        <div className="pb-4 pr-8">
          {item.a.split('\n').map((line, i) => (
            <p key={i} className="text-sm text-gray-500 leading-relaxed">{line}</p>
          ))}
        </div>
      )}
    </div>
  )
}

export default function FAQ() {
  return (
    <div className="max-w-2xl space-y-8">

      {/* Header */}
      <div>
        <h1 className="text-lg font-semibold text-gray-900">Ajuda</h1>
        <p className="text-sm text-gray-400 mt-0.5">Guias e respostas para o sistema.</p>
      </div>

      {/* Callouts */}
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="flex items-start gap-3 rounded-xl bg-gray-50 border border-gray-100 p-4">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white border border-gray-200">
            <Globe className="h-4 w-4 text-gray-500" />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-700">Salvar não atualiza a loja</p>
            <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">
              Após editar, clique no botão globo para sincronizar com o WooCommerce.
            </p>
          </div>
        </div>
        <div className="flex items-start gap-3 rounded-xl bg-gray-50 border border-gray-100 p-4">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white border border-gray-200">
            <Download className="h-4 w-4 text-blue-500" />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-700">Importe do WooCommerce</p>
            <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">
              Use "Importar do Woo" em Categorias e Produtos para trazer tudo de uma vez, sem digitar nada.
            </p>
          </div>
        </div>
        <div className="flex items-start gap-3 rounded-xl bg-gray-50 border border-gray-100 p-4">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white border border-gray-200">
            <RefreshCw className="h-4 w-4 text-blue-500" />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-700">Sync em massa</p>
            <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">
              O botão "Sync todos" envia de uma vez todos os produtos ativos ainda não sincronizados.
            </p>
          </div>
        </div>
        <div className="flex items-start gap-3 rounded-xl bg-gray-50 border border-gray-100 p-4">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white border border-gray-200">
            <Copy className="h-4 w-4 text-gray-500" />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-700">Duplicar produto</p>
            <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">
              Clique no ícone de cópia para clonar um produto como rascunho inativo.
            </p>
          </div>
        </div>
      </div>

      {/* Guia passo a passo */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <BookOpen className="h-3.5 w-3.5 text-gray-400" />
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Guia passo a passo</span>
        </div>
        <div className="rounded-xl border border-gray-100 bg-white px-4 divide-y divide-gray-100">
          {guides.map((g, i) => (
            <GuideItem key={g.title} guide={g} index={i} />
          ))}
        </div>
      </div>

      {/* FAQ */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <HelpCircle className="h-3.5 w-3.5 text-gray-400" />
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Perguntas frequentes</span>
        </div>
        <div className="space-y-2">
          {faqs.map(section => (
            <div key={section.section} className="rounded-xl border border-gray-100 bg-white px-4">
              <div className="pt-4 pb-1">
                <span className="text-[10px] font-bold text-[#15A344] uppercase tracking-widest">{section.section}</span>
              </div>
              {section.items.map(item => (
                <FAQItem key={item.q} item={item} />
              ))}
            </div>
          ))}
        </div>
      </div>

      <p className="text-xs text-gray-300 text-center pb-2">Sistema ERP · Codigin</p>
    </div>
  )
}
