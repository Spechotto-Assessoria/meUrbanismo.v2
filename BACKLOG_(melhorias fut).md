# 🚀 Backlog e Melhorias Futuras (meUrbanismo)

Este documento guarda ideias, dívidas técnicas e melhorias de segurança que foram mapeadas, mas adiadas para manter a velocidade do lançamento (MVP).

## 🔒 Segurança (Fase 2)
- [ ] **Migrar Storage para Buckets Privados (Signed URLs):** Atualmente os arquivos usam URLs públicas com nomes difíceis de adivinhar (UUIDs). No futuro, trancar o bucket e usar `supabase.storage.from('obras').createSignedUrl()` para gerar links temporários (ex: expiram em 1 hora) para PDFs de medições e projetos sensíveis.
- [ ] **Tokens Opacos nos Convites:** Refatorar o sistema de convites para não expor e-mails ou IDs diretos na URL de aceite, utilizando um token JWT ou hash único de uso único.

## ✨ Funcionalidades
- [ ] Integração de relatórios automáticos via WhatsApp (usando API Oficial).
- [ ] Dashboards gráficos financeiros avançados para investidores.