# Variáveis de Ambiente para Produção

Este documento lista todas as variáveis de ambiente necessárias para cada plataforma de hospedagem.

## 🗄️ Neon Database

### Connection String
Após criar o projeto no Neon, você receberá uma string de conexão no formato:
```
postgresql://username:password@ep-xxx-xxx.us-east-1.aws.neon.tech/neondb?sslmode=require
```

## 🖥️ Render (Backend)

### Variáveis Obrigatórias
```bash
DATABASE_URL=postgresql://username:password@ep-xxx-xxx.us-east-1.aws.neon.tech/neondb?sslmode=require
SESSION_SECRET=uma-string-aleatoria-muito-segura-de-pelo-menos-32-caracteres
HYPERSWITCH_API_KEY=pk_snd_sua_chave_privada_hyperswitch
HYPERSWITCH_PUBLISHABLE_KEY=pk_pbl_sua_chave_publica_hyperswitch
RESEND_API_KEY=re_sua_chave_resend
NODE_ENV=production
PORT=10000
```

### Variáveis Opcionais (para Replit Auth)
```bash
REPLIT_DOMAINS=seu-frontend.vercel.app
ISSUER_URL=https://replit.com/oidc
REPL_ID=seu-repl-id
```

### Como Configurar no Render
1. Acesse seu serviço no dashboard do Render
2. Vá para "Environment" 
3. Clique em "Add Environment Variable"
4. Adicione cada variável individualmente

## 🌐 Vercel (Frontend)

### Variáveis Obrigatórias
```bash
VITE_API_URL=https://seu-backend.onrender.com
VITE_HYPERSWITCH_PUBLISHABLE_KEY=pk_pbl_sua_chave_publica_hyperswitch
```

### Como Configurar na Vercel
1. Acesse seu projeto no dashboard da Vercel
2. Vá para "Settings" → "Environment Variables"
3. Adicione cada variável para "Production", "Preview" e "Development"

## 🔑 Como Obter as Chaves API

### HyperSwitch
1. Acesse [hyperswitch.io](https://hyperswitch.io)
2. Crie uma conta e faça login
3. Vá para "API Keys" ou "Developers"
4. Copie a "Secret Key" (pk_snd_...) para HYPERSWITCH_API_KEY
5. Copie a "Publishable Key" (pk_pbl_...) para HYPERSWITCH_PUBLISHABLE_KEY

### Resend
1. Acesse [resend.com](https://resend.com)
2. Crie uma conta e faça login
3. Vá para "API Keys"
4. Clique em "Create API Key"
5. Copie a chave (re_...) para RESEND_API_KEY

### Session Secret
Gere uma string aleatória segura:
```bash
# No Linux/Mac
openssl rand -hex 32

# Ou use um gerador online confiável
# Exemplo: 8f4a9c2e1d6b7a3e5f8c9d2a1b4e7f9c2d5a8b1e4f7a9c2d5e8b1a4f7c9d2e5a8b
```

## ⚙️ Configurações Adicionais

### CORS no Backend
Certifique-se de que o arquivo `server/index.ts` inclui seu domínio Vercel:
```typescript
app.use(cors({
  origin: [
    'https://seu-projeto.vercel.app',
    'http://localhost:5173' // para desenvolvimento
  ],
  credentials: true
}));
```

### HyperSwitch Dashboard
1. Faça login no dashboard do HyperSwitch
2. Vá para "Webhooks" ou "Settings"
3. Adicione os domínios autorizados:
   - `https://seu-projeto.vercel.app`
   - `https://seu-backend.onrender.com`

### Resend Dashboard
1. Configure o domínio de envio (opcional)
2. Verifique se não há limites de rate que possam afetar o sistema

## 🔒 Segurança

### Boas Práticas
- Nunca commite arquivos `.env` para o Git
- Use strings aleatórias fortes para SESSION_SECRET
- Regenere chaves API periodicamente
- Configure domínios específicos nos dashboards dos serviços
- Use HTTPS em produção (automático na Vercel/Render)

### Variáveis Sensíveis
Estas variáveis contêm informações sensíveis e devem ser protegidas:
- `DATABASE_URL` - Acesso completo ao banco
- `SESSION_SECRET` - Segurança das sessões
- `HYPERSWITCH_API_KEY` - Processamento de pagamentos
- `RESEND_API_KEY` - Envio de emails

## 📋 Checklist de Configuração

### Antes do Deploy
- [ ] Conta criada no Neon
- [ ] Conta criada no Render
- [ ] Conta criada na Vercel
- [ ] Conta criada no HyperSwitch
- [ ] Conta criada no Resend
- [ ] Todas as chaves API obtidas

### Durante o Deploy
- [ ] Database criado no Neon
- [ ] CONNECTION_STRING copiada
- [ ] Variáveis configuradas no Render
- [ ] Variáveis configuradas na Vercel
- [ ] Domínios configurados no HyperSwitch
- [ ] Migrações executadas

### Após o Deploy
- [ ] Frontend acessível
- [ ] Backend respondendo
- [ ] Login funcionando
- [ ] Sistema KYC operacional
- [ ] Pagamentos processando
- [ ] Emails sendo enviados

## 🚨 Troubleshooting

### Erro: "Database connection failed"
- Verifique se DATABASE_URL está correta
- Confirme que o banco está rodando no Neon
- Execute as migrações: `npm run db:push`

### Erro: "CORS blocked"
- Adicione o domínio Vercel na configuração CORS
- Verifique se VITE_API_URL está correto

### Erro: "Payment processing failed"
- Confirme as chaves HyperSwitch
- Verifique se os domínios estão configurados
- Teste com transações pequenas primeiro

### Erro: "Email not sending"
- Verifique a chave RESEND_API_KEY
- Confirme que o domínio está verificado (se aplicável)
- Cheque os logs do Resend dashboard

---

Para suporte adicional, consulte a documentação oficial de cada serviço ou entre em contato através dos canais de suporte.