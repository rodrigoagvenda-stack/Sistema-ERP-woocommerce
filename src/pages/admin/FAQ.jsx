import { useState, useMemo } from 'react'
import { ChevronDown, Search, Globe, Download, RefreshCw, Copy, Package, Tag, BarChart2, Settings, HelpCircle, BookOpen, Layers, Palette, Gift, BadgePercent, CreditCard } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'

/* ─── Seções ─────────────────────────────────────────────────── */
const SECTIONS = [
  {
    id: 'primeiros-passos',
    icon: BookOpen,
    label: 'Primeiros Passos',
    color: 'text-emerald-600',
    bg: 'bg-emerald-50',
    items: [
      {
        q: 'Como configurar a integração com o WooCommerce?',
        a: `1. Vá em WooCommerce → Configurações no menu lateral.\n2. No painel do WordPress, acesse WooCommerce → Configurações → Avançado → API REST.\n3. Clique em "Adicionar chave", dê um nome, selecione Leitura/Escrita e clique em "Gerar chave de API".\n4. Copie a Consumer Key e a Consumer Secret.\n5. Cole as chaves no ERP (URL da loja + Consumer Key + Consumer Secret) e salve.\n6. Se "Conexão OK" aparecer ou os dados carregarem, a integração está ativa.`,
      },
      {
        q: 'Qual a ordem correta para começar a usar o sistema?',
        a: `Siga esta ordem para evitar problemas de vínculo:\n1. Configure a integração WooCommerce.\n2. Importe ou crie Categorias (sincronize cada uma).\n3. Crie Marcas e Estilos.\n4. Importe ou crie Produtos.\n5. Sincronize os produtos com o WooCommerce.`,
      },
      {
        q: 'Como faço login no sistema?',
        a: 'Acesse a página de login, insira seu e-mail e senha cadastrados e clique em "Entrar". Em caso de erro, verifique as credenciais. Para redefinir senha, contate o administrador no painel do Supabase (Authentication → Users).',
      },
    ],
  },
  {
    id: 'categorias',
    icon: Layers,
    label: 'Categorias',
    color: 'text-blue-600',
    bg: 'bg-blue-50',
    items: [
      {
        q: 'Como importar categorias do WooCommerce?',
        a: 'Vá em Produtos → Categorias e clique em "Importar do Woo". O sistema busca todas as categorias (incluindo hierarquia pai/filho). Categorias já cadastradas são ignoradas automaticamente.',
      },
      {
        q: 'Como criar categorias e subcategorias manualmente?',
        a: `1. Crie primeiro as categorias PAI (ex: "Cervejas Artesanais") e salve.\n2. Clique no botão globo para sincronizar com o WooCommerce — aguarde o Woo ID aparecer.\n3. Crie as subcategorias selecionando a categoria pai no campo "Categoria Pai".\n4. Salve e clique no globo para sincronizar a subcategoria.\nSempre sincronize categorias ANTES dos produtos.`,
      },
      {
        q: 'Qual a diferença entre Categoria e Subcategoria?',
        a: `A Categoria PAI é o agrupamento principal (ex: "Telhas Metálicas").\nA Subcategoria é um nível abaixo da pai — para criá-la, basta selecionar uma categoria existente no campo "Categoria Pai" ao criar uma nova categoria (ex: "Telhas Onduladas" com pai "Telhas Metálicas").\n\nNo cadastro de produto:\n• O campo "Categoria" lista apenas as categorias PAI.\n• O campo "Subcategoria" filtra automaticamente as filhas da categoria escolhida.\n\nDica: sempre crie e sincronize as categorias PAI antes das subcategorias.`,
      },
      {
        q: 'Por que preciso sincronizar categorias antes dos produtos?',
        a: 'O WooCommerce usa um ID numérico próprio (Woo ID) para vincular categorias a produtos. Se a categoria não tiver Woo ID, o produto não consegue ser vinculado a ela corretamente.',
      },
      {
        q: 'Como adicionar imagem a uma categoria?',
        a: 'Ao criar ou editar uma categoria, faça upload da imagem no campo disponível. A imagem é enviada ao WooCommerce automaticamente na sincronização via URL pública.',
      },
      {
        q: 'O que acontece ao deletar uma categoria?',
        a: 'A categoria é removida do ERP e também do WooCommerce (DELETE com force=true). Produtos vinculados perdem a referência — recomendamos reatribuí-los antes de deletar.',
      },
    ],
  },
  {
    id: 'produtos',
    icon: Package,
    label: 'Produtos',
    color: 'text-violet-600',
    bg: 'bg-violet-50',
    items: [
      {
        q: 'Como criar um novo produto?',
        a: `Clique em "+ Novo Produto" na página de Produtos.\n• Passo 1 (Básico): nome, preço, estoque, status e estoque mínimo.\n• Passo 2 (Detalhes): categoria, subcategoria, marca, estilo, descrição e dimensões/peso.\n• Passo 3 (Mídia): imagem principal e galeria (mínimo 600px, redimensionada para 1200×1200).\nApós criar, clique no globo para enviar ao WooCommerce.`,
      },
      {
        q: 'Como sincronizar um produto com o WooCommerce?',
        a: 'Clique no botão globo ao lado do produto. Se ainda não existe no WooCommerce, será criado. Se já existe (tem Woo ID), será atualizado automaticamente ao editar e salvar.',
      },
      {
        q: 'Como sincronizar todos os produtos de uma vez?',
        a: 'Se houver produtos ativos sem Woo ID, o botão "Sync todos (N)" aparece no header da página. Clique nele para enviar todos de uma só vez. Um resumo mostrará quantos foram enviados e quantos tiveram erro.',
      },
      {
        q: 'Como importar produtos do WooCommerce?',
        a: 'Clique em "Importar do Woo" na página de Produtos. O sistema busca todos os produtos em lotes de 100, mapeando categorias, estilos e imagens automaticamente. Produtos já importados não são duplicados.',
      },
      {
        q: 'Como duplicar um produto?',
        a: 'Clique no ícone de cópia na linha do produto. Um clone é criado com nome "(cópia)", status Inativo e sem Woo ID. Edite e sincronize quando estiver pronto.',
      },
      {
        q: 'Como filtrar produtos na listagem?',
        a: 'Use a barra de busca para pesquisar por nome. Filtre por categoria no seletor ao lado. Use as pills para ver: Todos, Ativos, Inativos ou ⚠️ Estoque crítico.',
      },
      {
        q: 'O que é Estoque crítico?',
        a: 'Produtos cujo estoque atual está abaixo do Estoque Mínimo definido. Ficam destacados com fundo âmbar na listagem e contados na pill "⚠️ Estoque crítico".',
      },
      {
        q: 'Ao excluir um produto ele some da loja também?',
        a: 'Sim. Se o produto tiver Woo ID, é deletado do WooCommerce com force=true (remoção permanente, não vai para a lixeira) antes de ser removido do ERP.',
      },
      {
        q: 'Qual o tamanho ideal para imagens de produto?',
        a: 'O sistema aceita qualquer imagem a partir de 600×600px e redimensiona automaticamente para 1200×1200px com corte centralizado (cover crop). Imagens menores que 600px em ambas as dimensões são rejeitadas.',
      },
    ],
  },
  {
    id: 'marcas-estilos',
    icon: Palette,
    label: 'Marcas e Estilos',
    color: 'text-amber-600',
    bg: 'bg-amber-50',
    items: [
      {
        q: 'Como criar uma marca?',
        a: 'Vá em Produtos → Marcas, clique em "+ Nova Marca", preencha nome e slug, salve e clique no globo para sincronizar com o WooCommerce como atributo global "Marca".',
      },
      {
        q: 'O que são os Estilos?',
        a: 'Estilos são tipos de produto (ex: IPA, Stout, Pilsen). Cadastre em Produtos → Estilos. No WooCommerce, são enviados como o atributo "Estilo" do produto.',
      },
      {
        q: 'O que acontece ao deletar um estilo?',
        a: 'O campo "estilo" é limpo em todos os produtos que usavam esse estilo. A ação não pode ser desfeita.',
      },
    ],
  },
  {
    id: 'analytics',
    icon: BarChart2,
    label: 'Analytics',
    color: 'text-cyan-600',
    bg: 'bg-cyan-50',
    items: [
      {
        q: 'O que está disponível em Analytics?',
        a: 'Visão Geral, Produtos mais vendidos, Receita por período, Pedidos (com opção de cancelar), Variações, Categorias e Estoque.',
      },
      {
        q: 'Como cancelar um pedido?',
        a: 'Na tela Analytics → Pedidos, clique no ícone de X ao lado do pedido (disponível para pedidos com status Pendente, Processando ou Em espera). Uma confirmação será exibida antes de cancelar no WooCommerce.',
      },
      {
        q: 'Como enviar mensagem de WhatsApp para um cliente pelo painel?',
        a: `Na tela Analytics → Pedidos, há um botão verde de WhatsApp ao lado de cada pedido. Ao clicar, o WhatsApp Web (ou app do celular) abre automaticamente com uma mensagem já escrita, incluindo o nome do cliente, número do pedido e valor.\n\nA mensagem muda de acordo com o status do pedido:\n• Pendente: lembrete para finalizar a compra.\n• Em espera: aviso de que aguardamos confirmação de pagamento.\n• Processando: confirmação do pedido e aviso de envio em breve.\n• Concluído: agradecimento e pedido de avaliação.\n• Cancelado: convite para fazer um novo pedido.\n\nRequisitos:\n• O WhatsApp deve estar aberto no computador (WhatsApp Web) ou celular onde o sistema está sendo usado.\n• O cliente precisa ter preenchido o telefone corretamente no checkout — se não houver número cadastrado, o sistema avisa na hora.`,
      },
      {
        q: 'Como configurar metas de receita?',
        a: 'Vá em Analytics → Configurações. Lá você define meta de receita, período padrão e limiar de estoque baixo.',
      },
      {
        q: 'Os dados são em tempo real?',
        a: 'Sim. Pedidos e analytics são buscados diretamente do WooCommerce via integração ativa. A página de Pedidos atualiza automaticamente a cada 30 segundos.',
      },
    ],
  },
  {
    id: 'woocommerce',
    icon: Globe,
    label: 'WooCommerce',
    color: 'text-purple-600',
    bg: 'bg-purple-50',
    items: [
      {
        q: 'O que são os Logs de Sync?',
        a: 'Registram todas as operações de sincronização: criações, atualizações e erros. Acesse em WooCommerce → Logs de Sync para diagnosticar falhas.',
      },
      {
        q: 'O que fazer quando a sincronização falha?',
        a: 'Verifique os Logs de Sync para ver o erro detalhado. Causas comuns: credenciais incorretas, categoria sem Woo ID, produto com campos obrigatórios ausentes ou conexão instável.',
      },
      {
        q: 'Salvar um produto atualiza a loja automaticamente?',
        a: 'Sim, mas apenas para produtos que já possuem Woo ID (já foram sincronizados). Produtos novos precisam do clique no globo para a primeira sincronização.',
      },
      {
        q: 'Como configurar frete e pagamentos?',
        a: 'Acesse WooCommerce → Frete para configurar zonas e métodos de entrega. Acesse WooCommerce → Pagamentos para ativar e configurar os métodos de pagamento.',
      },
    ],
  },
  {
    id: 'mercadopago',
    icon: CreditCard,
    label: 'Mercado Pago',
    color: 'text-sky-600',
    bg: 'bg-sky-50',
    items: [
      {
        q: 'Como configurar o Mercado Pago?',
        a: `1. Acesse Integrações no menu lateral.\n2. Clique em "Mercado Pago" e insira o Access Token (começa com APP_USR-).\n3. Você encontra o token em mercadopago.com.br → Sua loja → Credenciais → Credenciais de produção.\n4. Clique em "Salvar" e depois em "Testar conexão" para validar.`,
      },
      {
        q: 'Como funciona o Checkout Pro (Kits)?',
        a: `O cliente clica no botão do kit na landing page → o sistema cria uma preferência de pagamento no Mercado Pago via Edge Function → o checkout abre em uma nova aba com todas as opções de pagamento (cartão, Pix, boleto).\n\nO processo é 100% seguro: o token do Mercado Pago fica apenas no servidor (Edge Function), nunca exposto ao navegador.`,
      },
      {
        q: 'Como verificar ou reembolsar um pagamento MP?',
        a: `Na tela Analytics → Pedidos, expanda o pedido e acesse a seção "Pagamento".\n• Verificar MP: consulta o status real do pagamento na API do Mercado Pago.\n• Reembolsar: inicia o reembolso total. O valor é devolvido ao cliente via MP.\n\nO botão só aparece para pedidos com método de pagamento Mercado Pago.`,
      },
      {
        q: 'O que é o Mercado Envios (frete ME2)?',
        a: `O Mercado Envios é o sistema de frete integrado ao checkout do Mercado Pago. Quando habilitado, o cliente informa o CEP no checkout e visualiza as opções de entrega com custo calculado automaticamente (Correios, transportadoras parceiras).\n\nPara funcionar:\n1. Configure Peso (kg) e Dimensões (Comprimento × Largura × Altura em cm) no cadastro de cada kit.\n2. A conta do Mercado Pago precisa estar inscrita no Mercado Envios (ativação gratuita no painel MP).\n\nSe o frete não aparecer no checkout, verifique se a conta MP está habilitada para ME2.`,
      },
      {
        q: 'Como aplicar frete grátis para um cupom?',
        a: `Crie um cupom do tipo "Frete grátis" em Cupons Kit.\nAo ser aplicado, o custo de frete é zerado na preferência do Mercado Pago — o cliente ainda escolhe o método de entrega, mas não paga nada pelo envio.`,
      },
    ],
  },
  {
    id: 'kits',
    icon: Gift,
    label: 'Kits de Venda',
    color: 'text-rose-600',
    bg: 'bg-rose-50',
    items: [
      {
        q: 'O que são os Kits de Venda?',
        a: `Kits são produtos compostos (ex: Kit 3 Frascos, Kit 6 Frascos) vendidos diretamente pelo Mercado Pago, sem passar pelo WooCommerce.\n\nIdeal para landing pages — o cliente clica no botão e vai direto para o checkout com o preço e quantidade travados.`,
      },
      {
        q: 'Como criar um kit?',
        a: `Acesse Kits no menu lateral e clique em "Criar kit".\n\nCampos obrigatórios:\n• Nome do kit (ex: "Kit 3 Frascos")\n• Preço (R$)\n• Peso (kg), Comprimento, Largura e Altura (cm) — necessários para cálculo de frete\n\nCampo opcional:\n• URL pós-pagamento: página para redirecionar o cliente após pagamento aprovado.`,
      },
      {
        q: 'Como usar o botão gerado pelo kit?',
        a: `Após criar o kit, um snippet HTML é gerado automaticamente.\n\n1. Clique em "Copiar código" no card do kit.\n2. No WordPress, adicione um bloco "HTML personalizado" na página.\n3. Cole o código e publique.\n\nO botão já inclui a lógica de abertura do checkout — não precisa editar nada.`,
      },
      {
        q: 'Posso ter kits com preços diferentes para o mesmo produto?',
        a: `Sim. Crie um kit para cada variação (1 frasco, 3 frascos, 6 frascos) com nomes e preços distintos. Cada kit gera um botão independente.`,
      },
      {
        q: 'Como atualizar o preço de um kit?',
        a: `No momento, exclua o kit antigo e crie um novo com o preço atualizado. O snippet gerado terá o novo kit_id — atualize o botão na landing page.`,
      },
    ],
  },
  {
    id: 'cupons-kit',
    icon: BadgePercent,
    label: 'Cupons Kit',
    color: 'text-orange-600',
    bg: 'bg-orange-50',
    items: [
      {
        q: 'Como criar um cupom de desconto para kit?',
        a: `Acesse "Cupons Kit" no menu lateral e clique em "Novo cupom".\n\nCampos:\n• Código: texto único que o cliente digita (ex: BEMVINDO10). Fica em maiúsculas automaticamente.\n• Tipo: % Desconto, R$ Fixo ou Frete grátis.\n• Valor: percentual ou valor em reais (não aparece para Frete grátis).\n• Kit específico (opcional): limita o cupom a um kit. Vazio = vale para todos.\n• Validade (opcional): data de expiração.\n• Limite de usos (opcional): quantas vezes o cupom pode ser usado no total.`,
      },
      {
        q: 'Como o cliente usa o cupom na landing page?',
        a: `Acima dos cards de kit, há um campo "Tem cupom de desconto?". O cliente digita o código e clica em "Aplicar". Ao clicar em "Comprar agora" em qualquer kit, o cupom é enviado automaticamente junto ao checkout.\n\nSe o cupom for inválido, expirado ou não for válido para o kit escolhido, o cliente recebe uma mensagem de erro antes de ir ao checkout.`,
      },
      {
        q: 'Como funciona o desconto percentual vs. valor fixo?',
        a: `• % Desconto: reduz o preço proporcionalmente. Ex: cupom de 10% num kit de R$ 302 → desconto de R$ 30,20 → cliente paga R$ 271,80.\n• R$ Fixo: subtrai um valor fixo do preço. Ex: R$ 50 off em kit de R$ 302 → cliente paga R$ 252.\n• Frete grátis: não altera o preço do produto, apenas zera o custo de entrega no checkout.`,
      },
      {
        q: 'Como acompanhar o uso dos cupons?',
        a: `Na lista de cupons, cada card exibe o contador "X usos" (ou "X/Limite usos" se tiver limite definido). O contador é incrementado automaticamente a cada compra concluída com o cupom.`,
      },
      {
        q: 'Posso desativar um cupom sem excluir?',
        a: `Sim. Clique em "Desativar" no card do cupom. O cupom fica inativo (aparece com opacidade reduzida) e o cliente recebe erro ao tentar usá-lo. Para reativar, clique em "Ativar".`,
      },
    ],
  },
  {
    id: 'configuracoes',
    icon: Settings,
    label: 'Configurações',
    color: 'text-gray-600',
    bg: 'bg-gray-50',
    items: [
      {
        q: 'Como ativar ou desativar funcionalidades?',
        a: 'O super-admin pode ativar ou desativar módulos por empresa: Pagamentos, Frete, Cupons, Site e Dimensões/Peso. Acesse o painel do super-admin → Empresas → editar empresa.',
      },
      {
        q: 'O que é a funcionalidade "Dimensões e Peso"?',
        a: 'Quando ativada, os campos de peso (kg), largura, altura e profundidade (cm) ficam obrigatórios no cadastro de produto — necessário para cálculo de frete via Melhor Envio.',
      },
      {
        q: 'Como criar cupons de desconto?',
        a: 'Acesse Cupons no menu lateral (disponível se a funcionalidade estiver ativa). Crie cupons com tipo percentual ou valor fixo, validade e limite de uso.',
      },
    ],
  },
]

/* ─── Components ─────────────────────────────────────────────── */
function FAQItem({ item, defaultOpen }) {
  const [open, setOpen] = useState(defaultOpen || false)
  return (
    <div className="border-b border-gray-100 last:border-0">
      <button
        className="w-full flex items-start justify-between gap-4 py-3.5 text-left group"
        onClick={() => setOpen(v => !v)}
      >
        <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900 leading-relaxed">{item.q}</span>
        <ChevronDown className={cn('h-4 w-4 shrink-0 text-gray-400 transition-transform duration-200 mt-0.5', open && 'rotate-180')} />
      </button>
      {open && (
        <div className="pb-4 pr-6 space-y-1">
          {item.a.split('\n').map((line, i) => (
            <p key={i} className={cn('text-sm leading-relaxed', line.match(/^\d+\./) ? 'text-gray-600 ml-2' : 'text-gray-500')}>
              {line}
            </p>
          ))}
        </div>
      )}
    </div>
  )
}

function SectionNav({ sections, active, onSelect }) {
  return (
    <nav className="flex flex-col gap-0.5">
      {sections.map(s => {
        const Icon = s.icon
        return (
          <button
            key={s.id}
            onClick={() => onSelect(s.id)}
            className={cn(
              'flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors text-left',
              active === s.id ? 'bg-gray-100 font-medium text-gray-900' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
            )}
          >
            <Icon className={cn('h-3.5 w-3.5 shrink-0', active === s.id ? s.color : 'text-gray-400')} />
            {s.label}
          </button>
        )
      })}
    </nav>
  )
}

/* ─── Main ───────────────────────────────────────────────────── */
export default function FAQ() {
  const [search,  setSearch]  = useState('')
  const [active,  setActive]  = useState('primeiros-passos')

  const query = search.trim().toLowerCase()

  const results = useMemo(() => {
    if (!query) return null
    const hits = []
    SECTIONS.forEach(s => {
      s.items.forEach(item => {
        if (item.q.toLowerCase().includes(query) || item.a.toLowerCase().includes(query)) {
          hits.push({ ...item, section: s.label, sectionColor: s.color })
        }
      })
    })
    return hits
  }, [query])

  const activeSection = SECTIONS.find(s => s.id === active)

  return (
    <div className="max-w-5xl">

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">Documentação</h1>
        <p className="text-sm text-gray-400 mt-0.5">Guias, funcionalidades e perguntas frequentes do sistema.</p>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
        <Input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar em toda a documentação..."
          className="pl-9 bg-white"
        />
        {search && (
          <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs">✕</button>
        )}
      </div>

      {/* Search results */}
      {results !== null ? (
        <div className="rounded-xl border border-gray-100 bg-white divide-y divide-gray-100 px-4">
          {results.length === 0 ? (
            <div className="py-10 text-center text-sm text-gray-400">Nenhum resultado para "{search}"</div>
          ) : results.map((item, i) => (
            <div key={i}>
              <div className="pt-3 pb-0">
                <span className={cn('text-[10px] font-semibold uppercase tracking-wider', item.sectionColor)}>{item.section}</span>
              </div>
              <FAQItem item={item} defaultOpen />
            </div>
          ))}
        </div>
      ) : (
        /* Two-column layout */
        <div className="flex gap-6">

          {/* Sidebar nav */}
          <aside className="hidden md:block w-44 shrink-0">
            <SectionNav sections={SECTIONS} active={active} onSelect={setActive} />
          </aside>

          {/* Mobile nav pills */}
          <div className="md:hidden flex gap-2 overflow-x-auto pb-2 mb-2 w-full">
            {SECTIONS.map(s => {
              const Icon = s.icon
              return (
                <button
                  key={s.id}
                  onClick={() => setActive(s.id)}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs whitespace-nowrap border transition-colors',
                    active === s.id ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-500 border-gray-200'
                  )}
                >
                  <Icon className="h-3 w-3" />
                  {s.label}
                </button>
              )
            })}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {activeSection && (
              <div>
                {/* Section header */}
                <div className={cn('flex items-center gap-2.5 px-4 py-3 rounded-xl mb-3', activeSection.bg)}>
                  <activeSection.icon className={cn('h-4 w-4', activeSection.color)} />
                  <span className={cn('text-sm font-semibold', activeSection.color)}>{activeSection.label}</span>
                  <span className="ml-auto text-xs text-gray-400">{activeSection.items.length} tópicos</span>
                </div>

                {/* Items */}
                <div className="rounded-xl border border-gray-100 bg-white px-4">
                  {activeSection.items.map(item => (
                    <FAQItem key={item.q} item={item} />
                  ))}
                </div>

                {/* Quick tips */}
                {active === 'primeiros-passos' && (
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    {[
                      { icon: Globe,     color: 'text-gray-500',   title: 'Salvar ≠ sincronizar', desc: 'Editar e salvar atualiza o ERP. O globo envia ao WooCommerce.' },
                      { icon: Download,  color: 'text-blue-500',   title: 'Importe do Woo',       desc: 'Use "Importar do Woo" em Categorias e Produtos para trazer tudo de uma vez.' },
                      { icon: RefreshCw, color: 'text-blue-500',   title: 'Sync em massa',        desc: 'O botão "Sync todos" envia de uma vez todos os produtos não sincronizados.' },
                      { icon: Copy,      color: 'text-gray-500',   title: 'Duplicar produto',     desc: 'Ícone de cópia clona um produto como rascunho inativo, pronto para editar.' },
                    ].map(tip => {
                      const Icon = tip.icon
                      return (
                        <div key={tip.title} className="flex items-start gap-3 rounded-xl bg-gray-50 border border-gray-100 p-4">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white border border-gray-200">
                            <Icon className={cn('h-4 w-4', tip.color)} />
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-gray-700">{tip.title}</p>
                            <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">{tip.desc}</p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      <p className="text-xs text-gray-300 text-center mt-8 pb-2">Sistema ERP · Codigin</p>
    </div>
  )
}
