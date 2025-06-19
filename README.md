# IYUUP - Plataforma de Cursos Online

Uma plataforma completa para criação, venda e gestão de cursos online, similar ao Hotmart, com sistema avançado de verificação de email e analytics detalhados.

## ✨ Funcionalidades Principais

### 🎯 Gestão de Cursos
- Criação e edição de cursos com interface intuitiva
- Upload de thumbnails e mídia
- Categorização personalizada
- Configuração de preços e políticas de reembolso
- Sistema de slugs para URLs amigáveis
- Gerenciamento de aulas e conteúdo

### 🔐 Sistema de Autenticação e KYC
- **Autenticação via Replit Auth** - OpenID Connect seguro
- **Sistema KYC Completo** - Verificação de documentos obrigatória
- Upload de CPF, RG e comprovante de residência
- Aprovação por administradores com status em tempo real
- Estados: pendente → em análise → aprovado/rejeitado
- **Bloqueio de funcionalidades** até aprovação KYC
- Notificações elegantes com cards coloridos
- Interface dedicada para verificação de documentos

### 💰 Sistema de Vendas Completo
- Integração com gateway Hyperswitch.io
- Processamento de pagamentos PIX e cartão
- Links de vendas personalizados com preços promocionais
- Sistema de checkout otimizado
- **Coleta completa de endereços** durante compra
- Confirmação automática de pedidos

### 📊 Analytics e Relatórios Avançados
- Dashboard com métricas em tempo real
- **Gráfico de linha** para vendas dos últimos 30 dias
- Relatórios demográficos baseados em **dados reais de clientes**
- Demografia por **localização real** (endereços coletados)
- Análise de conversão e performance
- Produtos mais vendidos com métricas detalhadas
- Atividades recentes em tempo real

### 👥 Gestão Completa de Clientes
- Base de dados com **endereços completos**
- Histórico detalhado de compras
- Segmentação por produtos adquiridos
- Tracking de localização geográfica
- Dados demográficos para análises

### 🤝 Sistema de Parcerias
- Co-produtores com percentual de participação
- Programa de afiliados robusto
- Sistema de convites por email
- Gestão automática de comissões
- Dashboard de parceiros

### 🔗 Links de Vendas Inteligentes
- Criação de links personalizados
- Configuração de preços promocionais
- Tracking detalhado de conversões
- URLs amigáveis e otimizadas para SEO
- Estatísticas por link

### 💸 Sistema de Saques
- Controle de saldo disponível
- Histórico completo de transações
- Cálculo automático de taxas
- Interface intuitiva para solicitações
- Relatórios financeiros

### 📧 Sistema de Email Integrado
- **Resend.com** para envio profissional
- Emails de verificação automáticos
- Notificações de vendas em tempo real
- Templates responsivos
- Logs de entrega

## 🛠 Tecnologias Utilizadas

### Frontend
- **React 18** com TypeScript para desenvolvimento robusto
- **Tailwind CSS** para estilização moderna
- **Shadcn/ui** componentes UI profissionais
- **TanStack Query** para gerenciamento de estado
- **Wouter** para roteamento eficiente
- **Recharts** para gráficos interativos
- **Framer Motion** para animações

### Backend
- **Node.js** com Express para API REST
- **TypeScript** para tipagem completa
- **Drizzle ORM** para operações de banco
- **PostgreSQL** como banco principal
- **JWT** para autenticação segura
- **Bcrypt** para hash de senhas
- **Resend** para sistema de emails

### Infraestrutura
- **Vite** como bundler de última geração
- **ESBuild** para compilação ultrarrápida
- **Replit** para desenvolvimento e deploy
- **Neon** para banco PostgreSQL serverless

## 🚀 Instalação e Configuração

### Pré-requisitos
- Node.js 20+
- PostgreSQL ou Neon Database
- Conta no Hyperswitch.io
- Conta no Resend.com

### Variáveis de Ambiente Obrigatórias
```env
# Banco de dados
DATABASE_URL=postgresql://user:password@localhost:5432/iyuup

# Autenticação
JWT_SECRET=seu_jwt_secret_super_seguro

# Email (Resend)
RESEND_API_KEY=re_sua_chave_resend

# Pagamentos (Opcional)
HYPERSWITCH_API_KEY=sua_chave_hyperswitch
```

### Instalação Rápida
```bash
# Clone o repositório
git clone https://github.com/seu-usuario/iyuup.git
cd iyuup

# Instale as dependências
npm install

# Configure o banco de dados
npm run db:push

# Inicie o servidor de desenvolvimento
npm run dev
```

## 📁 Estrutura do Projeto

```
├── client/                    # Frontend React
│   ├── src/
│   │   ├── components/        # Componentes reutilizáveis
│   │   │   ├── ui/           # Componentes base
│   │   │   ├── email-verification-banner.tsx
│   │   │   └── ...
│   │   ├── pages/            # Páginas da aplicação
│   │   │   ├── dashboard.tsx
│   │   │   ├── email-verification.tsx
│   │   │   └── ...
│   │   ├── hooks/            # Custom hooks
│   │   └── lib/              # Utilitários
├── server/                   # Backend Express
│   ├── db.ts                # Configuração do banco
│   ├── routes.ts            # Rotas da API
│   ├── storage.ts           # Camada de dados
│   └── emailService.ts      # Serviço de emails
├── shared/                  # Código compartilhado
│   └── schema.ts           # Schemas do banco
└── package.json
```

## 🔌 API Endpoints

### Autenticação e Verificação
- `POST /api/auth/register` - Registro com verificação de email
- `POST /api/auth/login` - Login com status de verificação
- `GET /api/auth/me` - Dados do usuário autenticado
- `GET /api/verify-email/:token` - Verificação de email
- `POST /api/resend-verification` - Reenvio de email de verificação

### Gestão de Cursos
- `GET /api/courses` - Listar cursos do usuário
- `POST /api/courses` - Criar novo curso
- `PUT /api/courses/:id` - Atualizar curso
- `DELETE /api/courses/:id` - Excluir curso
- `GET /api/courses/:id/lessons` - Aulas do curso

### Sistema de Vendas
- `GET /api/sales` - Histórico de vendas
- `POST /api/sales` - Registrar nova venda
- `PATCH /api/sales/:id/status` - Atualizar status
- `GET /api/dashboard/analytics` - Métricas do dashboard

### Clientes e Demografia
- `GET /api/customers` - Lista completa de clientes
- `GET /api/customers/:id` - Detalhes do cliente
- `GET /api/reports/demographics` - Relatórios demográficos

### Links e Parcerias
- `GET /api/sales-links` - Links de vendas
- `POST /api/sales-links` - Criar link personalizado
- `GET /api/courses/:id/coproducers` - Co-produtores
- `GET /api/courses/:id/affiliates` - Afiliados

### Sistema de Webhooks
- `GET /api/webhooks` - Listar webhooks do usuário
- `POST /api/webhooks` - Criar novo webhook
- `PUT /api/webhooks/:id` - Atualizar webhook
- `DELETE /api/webhooks/:id` - Excluir webhook

### Webhooks Públicos para Integrações
- `POST /webhook/hyperswitch/payment` - Notificações Hyperswitch
- `POST /webhook/pix/notification` - Notificações PIX
- `POST /webhook/boleto/notification` - Notificações Boleto
- `POST /webhook/test` - Endpoint de teste
- `POST /webhook/course/updated` - Atualizações de produtos
- `POST /webhook/affiliate/commission` - Comissões de afiliados

### E-commerce Avançado
- `GET /api/offers` - Ofertas promocionais
- `POST /api/offers` - Criar nova oferta
- `GET /api/coupons` - Cupons de desconto
- `POST /api/coupons` - Criar cupom
- `POST /api/coupons/validate` - Validar cupom
- `GET /api/order-bumps` - Produtos adicionais
- `POST /api/order-bumps` - Criar order bump

## 🔗 Sistema de Webhooks Completo

### Configuração de Webhooks de Usuário

Os usuários podem configurar webhooks personalizados através da interface para receber notificações sobre eventos importantes:

#### Eventos Disponíveis
- `payment_confirmed` - Pagamento confirmado
- `payment_pending` - Pagamento pendente
- `product_updated` - Produto atualizado
- `commission_earned` - Comissão de afiliado recebida

#### Exemplo de Configuração
```json
{
  "event": "payment_confirmed",
  "url": "https://sua-api.com/webhook/pagamento",
  "secret": "seu_secret_opcional",
  "isActive": true
}
```

### Webhooks Públicos para Processamento de Pagamentos

#### 1. Hyperswitch Payment Webhook
**Endpoint:** `POST /webhook/hyperswitch/payment`

Recebe notificações do gateway Hyperswitch sobre status de pagamentos.

**Payload de Exemplo:**
```json
{
  "event_type": "payment.succeeded",
  "payment_id": "pay_123456789",
  "status": "succeeded",
  "amount": 19700,
  "currency": "BRL",
  "customer_email": "cliente@email.com",
  "metadata": {
    "user_id": "1",
    "course_id": "123"
  }
}
```

#### 2. PIX Notification Webhook
**Endpoint:** `POST /webhook/pix/notification`

Processa notificações de pagamentos PIX.

**Payload de Exemplo:**
```json
{
  "txid": "pix_abc123def456",
  "status": "approved",
  "valor": 197.00,
  "pagador": {
    "email": "cliente@email.com",
    "nome": "João Silva"
  },
  "timestamp": "2025-06-12T10:30:00Z"
}
```

#### 3. Boleto Notification Webhook
**Endpoint:** `POST /webhook/boleto/notification`

Recebe atualizações sobre pagamentos via boleto.

**Payload de Exemplo:**
```json
{
  "id": "boleto_789xyz",
  "status": "paid",
  "amount": 197.00,
  "payer_email": "cliente@email.com",
  "due_date": "2025-06-15",
  "paid_at": "2025-06-12T14:22:00Z"
}
```

#### 4. Course Update Webhook
**Endpoint:** `POST /webhook/course/updated`

Notifica sobre atualizações em produtos/cursos.

**Payload de Exemplo:**
```json
{
  "course_id": 123,
  "user_id": 1,
  "action": "updated",
  "course_data": {
    "title": "Novo Título do Curso",
    "price": 197.00,
    "status": "active"
  },
  "timestamp": "2025-06-12T10:30:00Z"
}
```

#### 5. Affiliate Commission Webhook
**Endpoint:** `POST /webhook/affiliate/commission`

Informa sobre comissões de afiliados geradas.

**Payload de Exemplo:**
```json
{
  "affiliate_id": 5,
  "sale_id": 789,
  "commission_amount": 39.40,
  "course_id": 123,
  "timestamp": "2025-06-12T10:30:00Z"
}
```

#### 6. Test Webhook
**Endpoint:** `POST /webhook/test`

Endpoint genérico para testes de integração.

**Resposta:**
```json
{
  "received": true,
  "timestamp": "2025-06-12T10:30:00Z",
  "data": { /* payload enviado */ }
}
```

### Webhooks de Usuário - Payloads Enviados

Quando eventos ocorrem, a plataforma dispara webhooks configurados pelos usuários:

#### Payment Confirmed
```json
{
  "event": "payment_confirmed",
  "payment_id": "pay_123456789",
  "amount": 197.00,
  "currency": "BRL",
  "customer_email": "cliente@email.com",
  "payment_method": "credit_card",
  "timestamp": "2025-06-12T10:30:00Z"
}
```

#### Commission Earned
```json
{
  "event": "commission_earned",
  "sale_id": 789,
  "commission_amount": 39.40,
  "course_id": 123,
  "timestamp": "2025-06-12T10:30:00Z"
}
```

#### Product Updated
```json
{
  "event": "product_updated",
  "course_id": 123,
  "action": "created",
  "course_data": {
    "title": "Novo Curso",
    "price": 297.00
  },
  "timestamp": "2025-06-12T10:30:00Z"
}
```

### Segurança dos Webhooks

- Todos os webhooks incluem timestamp para validação
- Suporte a secrets personalizados para verificação
- Headers de segurança incluídos nas requisições
- Retry automático em caso de falha
- Logs detalhados de todas as chamadas

### Monitoramento

A plataforma mantém logs completos de:
- Todas as tentativas de webhook
- Status de resposta dos endpoints
- Tentativas de retry
- Falhas e erros
- Estatísticas de performance

## 🎯 Funcionalidades Recém-Implementadas

### ✅ Sistema de Verificação de Email
- Verificação obrigatória no registro
- Banner de notificação no dashboard
- Reenvio de email de verificação
- Página dedicada para verificação
- Emails automatizados de boas-vindas

### ✅ Analytics com Dados Reais
- Gráfico de linha para vendas (substituindo barras)
- Demografia baseada em endereços reais de clientes
- Remoção de dados demográficos sintéticos
- Relatórios de localização precisos

### ✅ Sistema E-commerce Completo
- Sistema de cupons de desconto com validação
- Order bumps para produtos adicionais
- Ofertas promocionais com links personalizados
- Checkout integrado com cálculo dinâmico de preços
- Funcionalidade "Ofertas" movida para aba de edição de produtos

### ✅ Sistema de Webhooks Avançado
- Webhooks personalizados para usuários
- Integração com gateways de pagamento
- Notificações PIX e Boleto automáticas
- Logs completos e monitoramento
- Sistema de retry e segurança

### ✅ Melhorias de UX
- Posicionamento corrigido do banner de verificação
- Layout otimizado do dashboard
- Atalhos reorganizados acima das atividades
- Links corrigidos para criação de produtos
- Navegação simplificada com funcionalidades integradas

## 🚀 Próximas Funcionalidades

- [ ] Integração com redes sociais
- [ ] Aplicativo mobile
- [ ] Sistema de reviews e avaliações
- [ ] Marketplace de cursos
- [ ] Certificados digitais
- [ ] Sistema de gamificação
- [ ] API pública para desenvolvedores
- [ ] Sistema de chat em tempo real

## 🤝 Contribuição

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/NovaFuncionalidade`)
3. Commit suas mudanças (`git commit -m 'Adiciona nova funcionalidade'`)
4. Push para a branch (`git push origin feature/NovaFuncionalidade`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.

## 📞 Suporte

Para suporte técnico:
- Email: suporte@iyuup.com
- GitHub Issues: [Abrir issue](https://github.com/seu-usuario/iyuup/issues)
- Documentação: [Wiki do projeto](https://github.com/seu-usuario/iyuup/wiki)

---

**IYUUP** - Transformando conhecimento em negócio! 🚀