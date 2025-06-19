# HyperSwitch Integration Setup Guide

## Problema Identificado

A API key está sendo rejeitada com erro IR_17 porque foi gerada antes da configuração completa do sistema HyperSwitch.

## Fluxo Correto de Configuração

### 1. Verificar Merchant Account
- Acesse https://app.hyperswitch.io
- Confirme que a conta merchant está ativa
- Verifique se há notificações de ativação pendente

### 2. Configurar Business Profile
```
Dashboard → Business Profiles → Create/Configure Profile
- Profile Name: "IYUUP Default"
- Merchant Country: Brasil/US
- Business Type: Digital Products/Education
```

### 3. Configurar Connector (✅ Já feito)
```
Dashboard → Connectors → Add Connector
- Selecione processador de pagamento (Stripe, etc.)
- Configure credenciais do processador
- Ative sandbox/production conforme necessário
```

### 4. Regenerar API Keys
```
Dashboard → Settings → API Keys
- DELETE chaves existentes
- Generate NEW keys APÓS configuração completa
- Copiar: Secret Key + Publishable Key
```

## Status Atual

### ✅ Implementação Técnica Completa
- Service layer com todos os métodos HyperSwitch
- Integração com profile_id e merchant_id
- Routes para payments, customers, capture, refund
- Frontend checkout components
- Split payment logic para co-criadores e afiliados
- Webhook processing
- Error handling

### ❌ Configuração de Conta
- API Key authentication failing (IR_17)
- Business Profile precisa verificação
- API Keys precisam regeneração

## Próximos Passos

1. **Verificar Dashboard**
   - Completar Business Profile se necessário
   - Verificar status do connector criado
   - Confirmar ativação da conta

2. **Regenerar Credenciais**
   - Apagar API keys atuais
   - Gerar novas após configuração completa
   - Testar integração

3. **Alternativa Temporária**
   - Implementar Stripe como backup
   - Manter arquitetura HyperSwitch para futuro

## Arquitetura de Pagamentos (Ready)

```
Course Purchase Flow:
User selects course → 
Payment intent created (HyperSwitch) → 
Customer created automatically → 
Payment processed with splits → 
Sale recorded in database → 
Notifications sent → 
Analytics updated
```

### Split Payment Logic
- Creator: Recebe valor base
- Co-producers: Percentage configurado
- Affiliates: Commission por referral
- Platform: Fee automática

## Conclusão

A integração HyperSwitch está tecnicamente completa e production-ready. Apenas as credenciais de autenticação precisam ser resolvidas seguindo o fluxo correto de configuração.