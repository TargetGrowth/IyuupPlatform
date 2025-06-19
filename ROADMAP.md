# IYUUP - Roadmap de Melhorias

## 🎯 Fase 1 - Sistema de Ofertas e Gestão Avançada (Semana 1-2)

### ✅ Prioridade Alta
1. **Sistema de Ofertas**
   - Gerar ofertas com links personalizados
   - Valores diferenciados por oferta
   - Links de vendas direto no produto
   
2. **Gestão de Cupons de Desconto**
   - Criar/editar cupons
   - Configurar percentual/valor fixo
   - Definir validade e limite de uso
   
3. **Marketplace de Afiliação**
   - Produtos disponíveis para afiliação
   - Métricas básicas (vendas, % receita)
   - Dashboard de afiliados

## 🎯 Fase 2 - Sistema de Parcerias Completo (Semana 2-3)

### ✅ Prioridade Alta
4. **Co-produtores Avançado**
   - Múltiplos co-produtores por produto
   - Sistema de convites obrigatório
   - Validação de dados completos (KYC)
   - Definir % de recebimento

5. **Sistema de Afiliados**
   - Validação de dados completos
   - Gestão de comissões
   - Dashboard de performance

## 🎯 Fase 3 - Recursos de Vendas Avançados (Semana 3-4)

### ✅ Prioridade Média
6. **Order Bumps Múltiplos**
   - Adicionar múltiplas ofertas complementares
   - Configurar preços e descrições
   - Gestão no checkout

7. **Sistema de UpSell**
   - Produtos para venda adicional
   - Configurar sequência de ofertas
   - Integração pós-compra

## 🎯 Fase 4 - Compliance e Integrações (Semana 4-5)

### ✅ Prioridade Baixa
8. **Sistema KYC Completo**
   - Upload de documentos (CNH, RG, CPF)
   - Comprovante de residência
   - Dados de CNPJ
   - Validação por PSP

9. **Sistema de WebHooks**
   - Webhook de pagamento confirmado
   - Webhook aguardando pagamento
   - Webhook de edição de produto
   - Sistema de retry e logs

---

## 🛠 Implementação Técnica

### Estrutura de Banco Adicional
```sql
-- Ofertas/Promoções
offers (id, productId, title, originalPrice, salePrice, validUntil)

-- Cupons
coupons (id, code, type, value, validUntil, usageLimit, usedCount)

-- Order Bumps
order_bumps (id, productId, title, price, description, order)

-- UpSells
upsells (id, productId, upsellProductId, order, showAfterPurchase)

-- KYC Documents
kyc_documents (id, userId, docType, filePath, status, verifiedAt)

-- WebHooks
webhooks (id, userId, event, url, isActive, retries)
```

### APIs Necessárias
- `/api/offers` - Gestão de ofertas
- `/api/coupons` - Sistema de cupons
- `/api/affiliates/marketplace` - Produtos para afiliação
- `/api/order-bumps` - Gestão de bumps
- `/api/upsells` - Sistema de upsell
- `/api/kyc` - Upload e validação de documentos
- `/api/webhooks` - Configuração de webhooks

## 📋 Checklist de Desenvolvimento

### Fase 1 (Prioridade Imediata)
- [ ] Schema de ofertas no banco
- [ ] API de ofertas
- [ ] Interface de criação de ofertas
- [ ] Sistema de cupons completo
- [ ] Marketplace de afiliação
- [ ] Métricas de afiliados

### Próximas Fases
- [ ] Co-produtores com validação KYC
- [ ] Sistema de convites obrigatório
- [ ] Order bumps múltiplos
- [ ] UpSells configuráveis
- [ ] Upload de documentos KYC
- [ ] Sistema de webhooks

---

**Estimativa Total:** 4-5 semanas de desenvolvimento
**Recursos Críticos:** Ofertas, Cupons, Afiliação (Semana 1)