# Guia de Instalação Local - IYUUP

## Pré-requisitos

- Node.js 18+ ou 20+
- NPM ou Yarn
- Conta no Neon Database (gratuita)
- Conta no Resend.com (gratuita)

## 1. Clone e Instale Dependências

```bash
git clone <seu-repositorio>
cd IyuupPlatform
npm install
```

## 2. Configuração do Banco Neon

1. Acesse [neon.tech](https://neon.tech)
2. Crie uma conta gratuita
3. Crie um novo projeto
4. Copie a connection string que aparece no dashboard

## 3. Configuração das Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto:

```env
# Banco de dados Neon
DATABASE_URL="postgresql://username:password@hostname/database?sslmode=require"

# JWT Secret (gere uma string aleatória segura)
JWT_SECRET="seu_jwt_secret_super_seguro_aqui"

# Email Service (Resend)
RESEND_API_KEY="re_sua_chave_do_resend"

# Opcional - Pagamentos
HYPERSWITCH_API_KEY="sua_chave_hyperswitch"
```

### Como obter a RESEND_API_KEY:
1. Acesse [resend.com](https://resend.com)
2. Crie uma conta gratuita
3. Vá em API Keys no dashboard
4. Crie uma nova API key

## 4. Configuração do Banco de Dados

Execute os comandos para configurar o banco:

```bash
# Gerar as migrações
npx drizzle-kit generate

# Aplicar as migrações no banco
npx drizzle-kit push

# Verificar se funcionou (opcional)
npx drizzle-kit studio
```

## 5. Iniciar o Projeto

```bash
npm run dev
```

O projeto estará disponível em: `http://localhost:5000`

## 6. Teste de Funcionamento

1. Acesse `http://localhost:5000`
2. Clique em "Registrar"
3. Preencha os dados e registre-se
4. Verifique se o email de verificação foi enviado
5. Acesse o dashboard

## Comandos Úteis

```bash
# Desenvolvimento
npm run dev

# Verificar tipos TypeScript
npm run check

# Ver banco de dados (interface visual)
npx drizzle-kit studio

# Aplicar mudanças no schema
npx drizzle-kit push

# Reset completo do banco (cuidado!)
npx drizzle-kit drop
```

## Estrutura de Pastas

```
IyuupPlatform/
├── client/src/          # Frontend React
├── server/              # Backend Express
├── shared/              # Código compartilhado
├── .env                 # Variáveis de ambiente (criar)
├── drizzle.config.ts    # Configuração do Drizzle
└── package.json
```

## Solução de Problemas

### Erro: "drizzle-kit: command not found"
**Solução:** Use `npx drizzle-kit push` em vez de `drizzle-kit push`

### Erro: "DATABASE_URL must be set"
**Solução:** Verifique se o arquivo `.env` existe e tem a variável DATABASE_URL

### Erro: "Invalid token" no login
**Solução:** Verifique se JWT_SECRET está definido no `.env`

### Erro: "Failed to send email"
**Solução:** Verifique se RESEND_API_KEY está correto no `.env`

### Banco não conecta
**Solução:** Verifique se a connection string do Neon está correta e inclui `?sslmode=require`

## Recursos Úteis

- [Documentação Neon](https://neon.tech/docs)
- [Documentação Drizzle](https://orm.drizzle.team)
- [Documentação Resend](https://resend.com/docs)

## Dados de Teste

Após a instalação, você pode:

1. Registrar um usuário de teste
2. Criar alguns cursos
3. Simular algumas vendas para ver os gráficos
4. Testar o sistema de verificação de email

## Próximos Passos

Depois da instalação local funcionando:

1. Configure o sistema de pagamentos (Hyperswitch)
2. Adicione seus próprios cursos
3. Configure domínio personalizado
4. Implante em produção

---

**Suporte:** Se encontrar problemas, verifique os logs no terminal onde rodou `npm run dev`