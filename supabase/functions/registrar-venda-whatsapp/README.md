# Edge Function: registrar-venda-whatsapp

Esta Edge Function registra vendas realizadas via WhatsApp no sistema.

## Funcionalidades

- ✅ Criação/atualização automática de clientes
- ✅ Registro de vendas com múltiplos produtos
- ✅ Atualização automática de estoque
- ✅ Tracking de UTM parameters
- ✅ Suporte a diferentes métodos de pagamento
- ✅ Histórico completo de vendas por cliente

## Deploy

### 1. Instalar Supabase CLI

```bash
npm install -g supabase
```

### 2. Login no Supabase

```bash
supabase login
```

### 3. Link com seu projeto

```bash
supabase link --project-ref <seu-project-ref>
```

### 4. Deploy da função

```bash
supabase functions deploy registrar-venda-whatsapp
```

## Uso

### Endpoint

```
POST https://<seu-projeto>.supabase.co/functions/v1/registrar-venda-whatsapp
```

### Headers

```
Authorization: Bearer <seu-anon-key>
Content-Type: application/json
```

### Body (JSON)

```json
{
  "customer_name": "João Silva",
  "customer_phone": "+5511987654321",
  "customer_email": "joao@email.com",
  "products": [
    {
      "product_id": 1,
      "quantity": 2,
      "price": 99.90
    },
    {
      "product_id": 5,
      "quantity": 1,
      "price": 149.90
    }
  ],
  "total_amount": 349.70,
  "payment_method": "pix",
  "notes": "Cliente pediu entrega expressa",
  "utm_source": "instagram",
  "utm_medium": "stories",
  "utm_campaign": "black_friday"
}
```

### Resposta de Sucesso (201)

```json
{
  "success": true,
  "sale_id": 123,
  "customer_id": 45,
  "message": "Venda registrada com sucesso!"
}
```

### Resposta de Erro (400/500)

```json
{
  "error": "Mensagem de erro",
  "details": {}
}
```

## Exemplo de Uso no Frontend

```javascript
import { supabase } from './lib/supabase';

async function registrarVendaWhatsApp(venda) {
  try {
    const { data, error } = await supabase.functions.invoke(
      'registrar-venda-whatsapp',
      {
        body: venda
      }
    );

    if (error) throw error;

    console.log('Venda registrada:', data);
    return data;
  } catch (error) {
    console.error('Erro ao registrar venda:', error);
    throw error;
  }
}

// Uso
const vendaData = {
  customer_name: 'Maria Santos',
  customer_phone: '+5511999887766',
  customer_email: 'maria@email.com',
  products: [
    { product_id: 10, quantity: 1, price: 199.90 }
  ],
  total_amount: 199.90,
  payment_method: 'pix'
};

registrarVendaWhatsApp(vendaData)
  .then(result => alert('Venda registrada!'))
  .catch(error => alert('Erro: ' + error.message));
```

## Tabelas Necessárias

Execute o arquivo `SALES_MIGRATION.sql` no Supabase Dashboard antes de usar esta função:

- `customers` - Dados dos clientes
- `sales` - Vendas realizadas
- `sale_items` - Itens de cada venda
- `products` - Produtos (já existe)

## Variáveis de Ambiente

Configuradas automaticamente pelo Supabase:

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`

## Logs

Para ver os logs da função:

```bash
supabase functions logs registrar-venda-whatsapp
```

## Segurança

- A função valida campos obrigatórios
- Usa Row Level Security (RLS) do Supabase
- Requer autenticação via Authorization header
- Atualiza estoque de forma segura com GREATEST()

## Status de Venda

- `pending` - Pendente
- `paid` - Pago
- `cancelled` - Cancelado
- `shipped` - Enviado
- `delivered` - Entregue

## Métodos de Pagamento

Exemplos: `pix`, `boleto`, `cartao`, `whatsapp`, `dinheiro`, `transferencia`
