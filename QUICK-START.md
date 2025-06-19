# Guia Rápido de Deploy - IYUUP

Este é um guia resumido para deploy rápido em produção. Para instruções completas, consulte [DEPLOYMENT.md](./DEPLOYMENT.md).

## 🚀 Deploy em 5 Passos

### 1. Preparar o Banco de Dados (Neon)
```bash
# Criar projeto no Neon e copiar CONNECTION_STRING
export DATABASE_URL="sua-connection-string-neon"
npm run db:push
```

### 2. Configurar Backend (Render)
```bash
# No Render, configure:
# Build Command: npm install
# Start Command: npm run dev
# Environment Variables:
DATABASE_URL=sua-connection-string-neon
SESSION_SECRET=string-aleatoria-segura
HYPERSWITCH_API_KEY=sua-chave-api
HYPERSWITCH_PUBLISHABLE_KEY=sua-chave-publica
RESEND_API_KEY=sua-chave-resend
NODE_ENV=production
PORT=10000
```

### 3. Configurar Frontend (Vercel)
```bash
# Na Vercel, configure:
# Framework: Vite
# Build Command: vite build
# Output Directory: dist
# Environment Variables:
VITE_API_URL=https://seu-backend.onrender.com
VITE_HYPERSWITCH_PUBLISHABLE_KEY=sua-chave-publica
```

### 4. Atualizar CORS no Backend
No arquivo `server/index.ts`, adicione seu domínio Vercel:
```typescript
app.use(cors({
  origin: [
    'https://seu-projeto.vercel.app',
    'http://localhost:5173'
  ],
  credentials: true
}));
```

### 5. Configurar HyperSwitch
No dashboard do HyperSwitch, adicione os domínios:
- `https://seu-projeto.vercel.app`
- `https://seu-backend.onrender.com`

## 📋 Checklist de Deploy

- [ ] Neon database criado e CONNECTION_STRING copiada
- [ ] Migrações executadas (`npm run db:push`)
- [ ] Backend configurado no Render com todas as env vars
- [ ] Frontend configurado na Vercel com env vars
- [ ] CORS atualizado com domínio Vercel
- [ ] Domínios configurados no HyperSwitch
- [ ] Teste de funcionalidade completo

## 🔧 Comandos Úteis

```bash
# Executar migrações
npm run db:push

# Build do frontend
vite build

# Testar compilação TypeScript
npm run check

# Executar script de deploy
./scripts/deploy.sh all
```

## 🌐 URLs Finais

Após deploy bem-sucedido:
- **Frontend**: `https://seu-projeto.vercel.app`
- **Backend**: `https://seu-backend.onrender.com`
- **Admin**: `https://seu-projeto.vercel.app/admin`

## ⚡ Solução de Problemas

### Build falha na Vercel
- Verifique se `vite build` funciona localmente
- Confirme que todas as dependências estão no package.json

### Backend não conecta ao banco
- Verifique se DATABASE_URL está correta no Render
- Confirme que as migrações foram executadas

### Erro de CORS
- Adicione o domínio Vercel na configuração CORS
- Verifique se as URLs estão corretas

### Pagamentos não funcionam
- Confirme configuração de domínios no HyperSwitch
- Verifique se as chaves API estão corretas

---

Para instruções detalhadas e troubleshooting avançado, consulte [DEPLOYMENT.md](./DEPLOYMENT.md).