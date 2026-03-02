import { useState } from 'react'
import { ChevronDown, ChevronRight, CheckCircle2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

/* ─── Guias de passo a passo ───────────────────────────────── */
const guides = [
  {
    title: '1. Configurar a integração com o WooCommerce',
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
    title: '2. Criar categorias e subcategorias (faça isso ANTES dos produtos)',
    steps: [
      'Vá em Produtos → Categorias e clique em "+ Nova Categoria".',
      'Crie primeiro as categorias PAI (ex: "Cervejas Artesanais"). Salve.',
      'Clique no botão 🌐 (globo) da categoria para sincronizar com o WooCommerce. Aguarde o Woo ID aparecer.',
      'Agora crie as subcategorias: clique em "+ Nova Categoria", preencha o nome (ex: "IPA") e selecione a categoria pai.',
      'Salve e clique no 🌐 para sincronizar a subcategoria. O WooCommerce vai criá-la automaticamente como filha.',
      'Repita para todas as subcategorias necessárias.',
    ],
  },
  {
    title: '3. Criar marcas',
    steps: [
      'Vá em Produtos → Marcas e clique em "+ Nova Marca".',
      'Preencha o nome e o slug da marca.',
      'Salve e clique no 🌐 para sincronizar com o WooCommerce como atributo global "Marca".',
    ],
  },
  {
    title: '4. Criar e sincronizar produtos',
    steps: [
      'Vá em Produtos → clique em "+ Novo Produto".',
      'Preencha nome, descrição, preço, estoque e imagem.',
      'Selecione a Categoria (ex: "Cervejas Artesanais").',
      'Selecione a Subcategoria — ela vai aparecer automaticamente depois que você escolher a categoria (ex: "IPA").',
      'Selecione o Estilo da cerveja (ex: "American IPA"). Isso será enviado como atributo ao WooCommerce.',
      'Clique em "Criar Produto" para salvar no ERP.',
      'IMPORTANTE: clique no botão 🌐 (globo) para enviar o produto ao WooCommerce. Sem isso a loja não é atualizada.',
    ],
  },
  {
    title: '5. Configurar formas de pagamento',
    steps: [
      'Vá em WooCommerce → Formas de Pagamento.',
      'Os gateways disponíveis aparecem listados (PagBank, Pix, Boleto etc.).',
      'Clique em "Ativar" ou "Desativar" para cada gateway conforme necessário.',
      'Para configurar as credenciais do gateway (chaves de API do PagBank, por exemplo), acesse o wp-admin → WooCommerce → Configurações → Pagamentos uma única vez.',
    ],
  },
  {
    title: '6. Configurar frete (Melhor Envio)',
    steps: [
      'O plugin Melhor Envio precisa ser instalado e configurado no wp-admin → WooCommerce → Melhor Envio (token + conexão com a conta) uma única vez.',
      'Após configurado, acesse WooCommerce → Frete no ERP.',
      'Suas zonas de entrega aparecerão listadas com os métodos disponíveis (PAC, SEDEX, JadLog etc.).',
      'Clique em "Ativar" ou "Desativar" para cada método de frete conforme desejar.',
    ],
  },
]

/* ─── Perguntas frequentes ─────────────────────────────────── */
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
        a: 'O Dashboard exibe um resumo geral: total de produtos, categorias, marcas, tags, pedidos recentes, receita e indicadores de estoque baixo.',
      },
      {
        q: 'Os dados do Dashboard são em tempo real?',
        a: 'Sim. Os pedidos e dados de analytics são buscados diretamente do WooCommerce via a integração ativa.',
      },
    ],
  },
  {
    section: 'Categorias e Subcategorias',
    items: [
      {
        q: 'Qual a diferença entre categoria e subcategoria?',
        a: 'No WooCommerce, subcategoria não é um campo separado — é simplesmente uma categoria com uma "categoria pai" definida. Por exemplo: "Cervejas Artesanais" é a categoria pai. "IPA", "Stout" e "Lager" são subcategorias (categorias filhas). O ERP cuida disso automaticamente quando você preenche o campo "Categoria Pai" ao criar.',
      },
      {
        q: 'Como criar uma subcategoria?',
        a: 'Vá em Produtos → Categorias → "+ Nova Categoria". No campo "Categoria Pai", selecione a categoria mãe. Ao salvar e clicar no 🌐, o WooCommerce já entende que é uma subcategoria e cria automaticamente como filha.',
      },
      {
        q: 'Por que as categorias precisam ser sincronizadas antes dos produtos?',
        a: 'O WooCommerce usa um ID numérico próprio (Woo ID) para vincular categorias a produtos. Se a categoria não tiver Woo ID salvo, o produto não consegue ser vinculado a ela no WooCommerce. Por isso: sempre sincronize (🌐) categorias e subcategorias ANTES de sincronizar os produtos.',
      },
      {
        q: 'Como criar a estrutura completa de categorias para cervejas?',
        a: '1. Crie a categoria pai (ex: "Cervejas Artesanais") → 🌐 sincronize.\n2. Crie a subcategoria "IPA" com pai = "Cervejas Artesanais" → 🌐 sincronize.\n3. Repita para "Stout", "Lager", "Weiss", etc.\n4. Agora ao criar um produto, selecione a categoria e a subcategoria correspondente.',
      },
      {
        q: 'O que acontece ao deletar uma categoria que tem produtos?',
        a: 'O sistema automaticamente remove a referência da categoria dos produtos vinculados a ela (o produto fica sem categoria). Recomendamos reatribuir os produtos a outra categoria antes de deletar.',
      },
    ],
  },
  {
    section: 'Produtos',
    items: [
      {
        q: 'Como criar um novo produto?',
        a: 'Vá em Produtos → clique em "+ Novo Produto" → preencha nome, preço, estoque, categoria, subcategoria, estilo e imagens → clique em "Criar Produto". O produto é salvo no ERP. IMPORTANTE: após criar, clique no botão 🌐 (globo) para enviar ao WooCommerce.',
      },
      {
        q: 'O que é o campo "Subcategoria" no produto?',
        a: 'Após selecionar a Categoria, o campo Subcategoria aparece com as opções filhas daquela categoria. Ao sincronizar, o WooCommerce recebe o ID da subcategoria e categoriza o produto corretamente na hierarquia.',
      },
      {
        q: 'O que é o campo "Estilo" no produto?',
        a: 'O Estilo da cerveja (ex: "American IPA", "Double IPA", "Imperial Stout") é enviado ao WooCommerce como um atributo do produto chamado "Estilo". Ele aparece na aba "Atributos" de cada produto no WooCommerce e pode ser usado como filtro na loja.',
      },
      {
        q: 'Como editar um produto existente?',
        a: 'Clique no ícone de lápis (✏️) ao lado do produto. Faça as alterações e clique em "Salvar". Se o produto já está vinculado ao WooCommerce (tem Woo ID), clique no 🌐 para atualizar a loja também.',
      },
      {
        q: 'Como sincronizar um produto com o WooCommerce?',
        a: 'Clique no botão 🌐 (globo) ao lado do produto. Se o produto ainda não existe no WooCommerce, ele será criado. Se já existe, será atualizado. SEMPRE clique no 🌐 após criar ou editar um produto para refletir na loja.',
      },
      {
        q: 'Como adicionar imagens ao produto?',
        a: 'No formulário do produto, clique na área de imagem para fazer upload. A primeira imagem é a principal no WooCommerce. Você pode adicionar imagens adicionais na galeria.',
      },
      {
        q: 'O que significa "Estoque Mínimo"?',
        a: 'É a quantidade mínima antes de o produto ser sinalizado como estoque baixo no Dashboard e nos relatórios.',
      },
      {
        q: 'Criei o produto mas ele não aparece na loja, o que fazer?',
        a: 'Certifique-se de ter clicado no 🌐 (globo) para sincronizar. Verifique também se o produto está com status "Ativo" e se as credenciais do WooCommerce estão configuradas corretamente em WooCommerce → Configurações.',
      },
    ],
  },
  {
    section: 'Marcas',
    items: [
      {
        q: 'Como cadastrar uma marca?',
        a: 'Vá em Produtos → Marcas → "+ Nova Marca". Preencha nome e slug. Salve e clique no 🌐 para sincronizar com o WooCommerce como atributo global "Marca" (pa_marca).',
      },
      {
        q: 'As marcas aparecem no WooCommerce como atributo?',
        a: 'Sim. As marcas são sincronizadas como termos do atributo global "Marca" (pa_marca) no WooCommerce e podem ser usadas como filtro na loja.',
      },
    ],
  },
  {
    section: 'Tags',
    items: [
      {
        q: 'Como criar uma tag?',
        a: 'Vá em Produtos → Tags → "+ Nova Tag". Preencha nome e slug. Salve e clique no 🌐 para sincronizar com o WooCommerce.',
      },
      {
        q: 'Como vincular tags a um produto?',
        a: 'No formulário de edição do produto, há um campo de tags onde você seleciona as tags cadastradas e sincronizadas.',
      },
    ],
  },
  {
    section: 'Atributos',
    items: [
      {
        q: 'O que são atributos?',
        a: 'Atributos são características dos produtos como "Tamanho", "Cor", "Sabor", "IBU" etc. Cada atributo pode ter múltiplos termos (valores). O campo "Estilo" do produto é um atributo automático — você não precisa criar manualmente.',
      },
      {
        q: 'Como criar um atributo e seus termos?',
        a: 'Vá em Produtos → Atributos → "+ Novo Atributo". Após criar, expanda o atributo e clique em "+ Novo Termo" para adicionar os valores. Depois sincronize com o 🌐.',
      },
    ],
  },
  {
    section: 'Avaliações',
    items: [
      {
        q: 'De onde vêm as avaliações?',
        a: 'As avaliações são importadas diretamente do WooCommerce. São somente leitura no ERP.',
      },
      {
        q: 'Posso responder avaliações pelo ERP?',
        a: 'Não. Para responder avaliações, acesse o painel do WordPress diretamente.',
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
        q: 'Os dados de analytics são do WooCommerce?',
        a: 'Sim. Todos os dados de analytics são buscados em tempo real da API do WooCommerce.',
      },
      {
        q: 'Como configurar metas de receita?',
        a: 'Vá em Analytics → Configurações. Lá você pode definir meta de receita, período padrão e limiar de estoque baixo.',
      },
    ],
  },
  {
    section: 'WooCommerce — Configurações',
    items: [
      {
        q: 'Como configurar a integração com o WooCommerce?',
        a: 'Vá em WooCommerce → Configurações. Insira a URL da loja, Consumer Key e Consumer Secret. As chaves são geradas no WordPress em WooCommerce → Configurações → Avançado → API REST.',
      },
      {
        q: 'O que são os Logs de Sync?',
        a: 'Os logs registram todas as operações de sincronização entre o ERP e o WooCommerce: criações, atualizações e erros. Útil para diagnosticar falhas.',
      },
      {
        q: 'O que fazer quando a sincronização falha?',
        a: 'Verifique os Logs de Sync para ver o erro detalhado. As causas mais comuns são: credenciais incorretas, categoria sem Woo ID ou conexão instável.',
      },
    ],
  },
  {
    section: 'Formas de Pagamento',
    items: [
      {
        q: 'Como ativar ou desativar uma forma de pagamento?',
        a: 'Vá em WooCommerce → Formas de Pagamento. Clique em "Ativar" ou "Desativar" ao lado do gateway desejado (PagBank, Pix, Boleto etc.).',
      },
      {
        q: 'Posso configurar as credenciais do PagBank pelo ERP?',
        a: 'Não totalmente. As credenciais de API (token, chaves) do gateway precisam ser configuradas uma vez diretamente no wp-admin → WooCommerce → Configurações → Pagamentos. Pelo ERP você gerencia apenas se o gateway está ativo ou inativo.',
      },
      {
        q: 'O gateway que ativei não está aparecendo para o cliente, o que fazer?',
        a: 'Verifique se as credenciais do gateway estão configuradas corretamente no wp-admin. Um gateway ativo sem credenciais configuradas não será exibido na loja mesmo estando "ativo".',
      },
    ],
  },
  {
    section: 'Frete — Melhor Envio',
    items: [
      {
        q: 'Como o Melhor Envio funciona neste sistema?',
        a: 'O Melhor Envio é um plugin do WooCommerce. Ele precisa ser instalado e configurado no wp-admin (token da conta Melhor Envio) uma única vez. Após isso, os métodos de frete (PAC, SEDEX, JadLog etc.) ficam disponíveis para ativar/desativar pelo ERP em WooCommerce → Frete.',
      },
      {
        q: 'Como ativar ou desativar um método de frete?',
        a: 'Vá em WooCommerce → Frete. As zonas de entrega aparecerão com seus respectivos métodos. Clique em "Ativar" ou "Desativar" no método desejado.',
      },
      {
        q: 'O que são "Zonas de Entrega"?',
        a: 'Zonas de entrega são regiões configuradas no WooCommerce que definem quais métodos de frete ficam disponíveis para cada localidade. Ex: "Brasil" com PAC, SEDEX e JadLog ativos.',
      },
      {
        q: 'Preciso configurar algo no Melhor Envio além do token?',
        a: 'Após instalar o plugin e conectar a conta no wp-admin, tudo é gerenciado automaticamente. O Melhor Envio calcula os fretes em tempo real com base no CEP do cliente na hora do checkout.',
      },
    ],
  },
  {
    section: 'Site — Nossas Cervejas',
    items: [
      {
        q: 'O que é a seção "Nossas Cervejas"?',
        a: 'É o slider de cervejas exibido no site WordPress. Você pode pré-visualizar como ficará no ERP e os dados são buscados em tempo real do Supabase.',
      },
      {
        q: 'Como atualizar as cervejas exibidas no slider do site?',
        a: 'Os produtos exibidos no slider são os produtos ativos cadastrados no ERP. Para adicionar uma cerveja ao slider, cadastre o produto com status "Ativo", imagem e descrição preenchidos.',
      },
    ],
  },
]

/* ─── Componentes ───────────────────────────────────────────── */
function GuideCard({ guide }) {
  const [open, setOpen] = useState(false)
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        <button
          type="button"
          onClick={() => setOpen(v => !v)}
          className="w-full flex items-center justify-between gap-3 p-4 text-left hover:bg-gray-50 transition-colors"
        >
          <span className="text-sm font-semibold text-gray-800">{guide.title}</span>
          {open
            ? <ChevronDown className="h-4 w-4 shrink-0 text-[#c49018]" />
            : <ChevronRight className="h-4 w-4 shrink-0 text-gray-400" />}
        </button>
        {open && (
          <ol className="border-t border-gray-100 px-5 py-3 space-y-2.5">
            {guide.steps.map((step, i) => (
              <li key={i} className="flex items-start gap-3 text-sm text-gray-600 leading-relaxed">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#f4b522]/20 text-xs font-bold text-[#c49018]">
                  {i + 1}
                </span>
                {step}
              </li>
            ))}
          </ol>
        )}
      </CardContent>
    </Card>
  )
}

function FAQItem({ item }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border-b border-gray-100 last:border-0">
      <button
        className="w-full flex items-center justify-between gap-3 py-3 text-left text-sm font-medium text-gray-800 hover:text-gray-900"
        onClick={() => setOpen(!open)}
      >
        <span>{item.q}</span>
        {open
          ? <ChevronDown className="h-4 w-4 shrink-0 text-[#c49018]" />
          : <ChevronRight className="h-4 w-4 shrink-0 text-gray-400" />}
      </button>
      {open && (
        <div className="pb-3">
          {item.a.split('\n').map((line, i) => (
            <p key={i} className="text-sm text-gray-500 leading-relaxed mt-1">{line}</p>
          ))}
        </div>
      )}
    </div>
  )
}

export default function FAQ() {
  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Guia e Perguntas Frequentes</h1>
        <p className="text-sm text-gray-500 mt-1">
          Passo a passo e respostas para tudo sobre o Geezer ERP.
        </p>
      </div>

      {/* Aviso principal */}
      <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4">
        <span className="text-2xl">🌐</span>
        <div>
          <p className="text-sm font-semibold text-amber-800">Lembre-se: salvar no ERP não atualiza a loja!</p>
          <p className="text-sm text-amber-700 mt-0.5">
            Após criar ou editar um produto, categoria, marca ou tag, você <strong>precisa clicar no botão 🌐 (globo)</strong> para enviar as alterações ao WooCommerce. Sem isso, a loja não é atualizada.
          </p>
        </div>
      </div>

      {/* Guia passo a passo */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <CheckCircle2 className="h-4 w-4 text-[#c49018]" />
          <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wide">Guia Passo a Passo</h2>
        </div>
        <div className="space-y-2">
          {guides.map((g) => (
            <GuideCard key={g.title} guide={g} />
          ))}
        </div>
      </div>

      {/* FAQ */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <ChevronDown className="h-4 w-4 text-[#c49018]" />
          <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wide">Perguntas Frequentes</h2>
        </div>
        <div className="space-y-3">
          {faqs.map(section => (
            <Card key={section.section}>
              <CardContent className="pt-4 pb-2 px-5">
                <h3 className="text-xs font-semibold text-[#c49018] uppercase tracking-wide mb-2">
                  {section.section}
                </h3>
                {section.items.map(item => (
                  <FAQItem key={item.q} item={item} />
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <p className="text-xs text-gray-400 text-center pb-4">
        Desenvolvido com 💗 por Vend.ai - Grupo Venda
      </p>
    </div>
  )
}
