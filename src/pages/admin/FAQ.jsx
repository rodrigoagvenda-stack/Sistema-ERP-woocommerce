import { useState } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

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
    section: 'Produtos',
    items: [
      {
        q: 'Como criar um novo produto?',
        a: 'Vá em Produtos → clique em "+ Novo Produto" → preencha nome, preço, estoque, categoria e imagens → clique em "Criar Produto". O produto é salvo no ERP. Use o botão de sync (globo) para enviar ao WooCommerce.',
      },
      {
        q: 'Como editar um produto existente?',
        a: 'Clique no ícone de lápis ao lado do produto. Faça as alterações e clique em "Salvar". Se o produto já está vinculado ao WooCommerce (tem Woo ID), a atualização é enviada automaticamente.',
      },
      {
        q: 'Como sincronizar um produto com o WooCommerce?',
        a: 'Clique no ícone de globo (🌐) ao lado do produto. Se o produto ainda não existe no WooCommerce, ele será criado. Se já existe, será atualizado.',
      },
      {
        q: 'Como adicionar imagens ao produto?',
        a: 'No formulário do produto, clique na área de imagem principal para fazer upload. A primeira imagem é o destaque no WooCommerce. Você pode adicionar mais imagens na seção "Galeria de imagens".',
      },
      {
        q: 'O que significa "Estoque Mínimo"?',
        a: 'É a quantidade mínima antes de o produto ser sinalizado como estoque baixo no Dashboard e nos relatórios de estoque.',
      },
    ],
  },
  {
    section: 'Categorias',
    items: [
      {
        q: 'Como criar uma categoria?',
        a: 'Vá em Produtos → Categorias → "+ Nova Categoria". Preencha nome, slug e categoria pai (opcional). Ao salvar, a categoria é criada no ERP e sincronizada automaticamente com o WooCommerce.',
      },
      {
        q: 'Como sincronizar uma categoria com o WooCommerce?',
        a: 'Clique no ícone de globo ao lado da categoria. Caso a categoria ainda não tenha Woo ID, ela será criada no WooCommerce e o ID será salvo automaticamente.',
      },
      {
        q: 'O que é "Categoria Pai"?',
        a: 'Permite criar subcategorias. Por exemplo: "Cervejas" pode ser pai de "IPAs", "Lagers" etc.',
      },
    ],
  },
  {
    section: 'Marcas',
    items: [
      {
        q: 'Como cadastrar uma marca?',
        a: 'Vá em Produtos → Marcas → "+ Nova Marca". Preencha nome e slug. Ao salvar, a marca é criada no ERP. Use o botão de sync para enviar ao WooCommerce como um atributo global (pa_marca).',
      },
      {
        q: 'As marcas aparecem no WooCommerce como atributo?',
        a: 'Sim. As marcas são sincronizadas como termos do atributo global "Marca" (pa_marca) no WooCommerce.',
      },
    ],
  },
  {
    section: 'Tags',
    items: [
      {
        q: 'Como criar uma tag?',
        a: 'Vá em Produtos → Tags → "+ Nova Tag". Preencha nome e slug. Ao salvar, a tag é criada no ERP e pode ser sincronizada com o WooCommerce.',
      },
      {
        q: 'Como vincular tags a um produto?',
        a: 'No formulário de edição do produto, há um campo de tags onde você pode selecionar as tags cadastradas.',
      },
    ],
  },
  {
    section: 'Atributos',
    items: [
      {
        q: 'O que são atributos?',
        a: 'Atributos são características dos produtos como "Tamanho", "Cor", "Sabor" etc. Cada atributo pode ter múltiplos termos (valores).',
      },
      {
        q: 'Como criar um atributo e seus termos?',
        a: 'Vá em Produtos → Atributos → "+ Novo Atributo". Após criar, expanda o atributo e clique em "+ Novo Termo" para adicionar os valores.',
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
    section: 'WooCommerce',
    items: [
      {
        q: 'Como configurar a integração com o WooCommerce?',
        a: 'Vá em WooCommerce → Configurações. Insira a URL da loja, Consumer Key e Consumer Secret gerados no WordPress (WooCommerce → Configurações → Avançado → API REST).',
      },
      {
        q: 'O que são os Logs de Sync?',
        a: 'Os logs registram todas as operações de sincronização entre o ERP e o WooCommerce: criações, atualizações e erros. Útil para diagnosticar problemas.',
      },
      {
        q: 'O que fazer quando a sincronização falha?',
        a: 'Verifique os Logs de Sync para ver o erro detalhado. As causas mais comuns são: credenciais incorretas, produto não encontrado no WooCommerce ou conexão instável.',
      },
    ],
  },
]

function FAQItem({ item }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border-b border-gray-100 last:border-0">
      <button
        className="w-full flex items-center justify-between gap-3 py-3 text-left text-sm font-medium text-gray-800 hover:text-gray-900"
        onClick={() => setOpen(!open)}
      >
        <span>{item.q}</span>
        {open ? <ChevronDown className="h-4 w-4 shrink-0 text-[#c49018]" /> : <ChevronRight className="h-4 w-4 shrink-0 text-gray-400" />}
      </button>
      {open && (
        <p className="pb-3 text-sm text-gray-500 leading-relaxed">{item.a}</p>
      )}
    </div>
  )
}

export default function FAQ() {
  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-xl font-bold text-gray-900">FAQ — Perguntas Frequentes</h1>
        <p className="text-sm text-gray-500 mt-1">Tire suas dúvidas sobre como usar o Geezer ERP.</p>
      </div>

      {faqs.map(section => (
        <Card key={section.section}>
          <CardContent className="pt-4 pb-2 px-5">
            <h2 className="text-sm font-semibold text-[#c49018] uppercase tracking-wide mb-2">{section.section}</h2>
            {section.items.map(item => (
              <FAQItem key={item.q} item={item} />
            ))}
          </CardContent>
        </Card>
      ))}

      <p className="text-xs text-gray-400 text-center pb-4">
        Desenvolvido com 💗 por Vend.ai - Grupo Venda
      </p>
    </div>
  )
}
