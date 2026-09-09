# 🚀 Backlog e Melhorias Futuras (meUrbanismo)

Este documento guarda ideias, dívidas técnicas e melhorias de segurança que foram mapeadas, mas adiadas para manter a velocidade do lançamento (MVP).

## 🔒 Segurança (Fase 2)
- [ ] **Migrar Storage para Buckets Privados (Signed URLs):** Atualmente os arquivos usam URLs públicas com nomes difíceis de adivinhar (UUIDs). No futuro, trancar o bucket e usar `supabase.storage.from('obras').createSignedUrl()` para gerar links temporários (ex: expiram em 1 hora) para PDFs de medições e projetos sensíveis.
- [ ] **Tokens Opacos nos Convites:** Refatorar o sistema de convites para não expor e-mails ou IDs diretos na URL de aceite, utilizando um token JWT ou hash único de uso único.

## ✨ Funcionalidades
- [ ] Integração de relatórios automáticos via WhatsApp (usando API Oficial).
- [ ] Dashboards gráficos financeiros avançados para investidores.

## 📱 Mobilidade e Operação em Campo
- [ ] **Modo Offline (PWA / Service Workers):** Transformar o sistema em um PWA instalável no celular. Permitir o preenchimento do "Diário de Obra" e upload de fotos mesmo sem sinal de internet (4G/5G ruim no canteiro), sincronizando os dados automaticamente com o Supabase quando o aparelho conectar ao Wi-Fi.
- [ ] **Clima Automatizado (Integração de API):** Conectar uma API meteorológica (ex: OpenWeather) para puxar automaticamente as condições climáticas da manhã e da tarde com base nas coordenadas GPS do empreendimento, eliminando a seleção manual no Diário de Obra.

## 📂 Gestão Avançada de Projetos e Documentos
- [ ] **Versionamento Inteligente (R-00, R-01):** Criar uma lógica onde o upload de um projeto com o mesmo nome de um já existente crie automaticamente uma nova "Revisão", arquivando a anterior e mostrando sempre a mais atual para o cliente.
- [ ] **Marca D'água Dinâmica em PDFs:** Implementar uma Edge Function que estampa o Nome, IP e Data de download como marca d'água invisível (ou visível) nos arquivos baixados por Corretores e Clientes. Excelente para inibir o vazamento de projetos estruturais ou de loteamento.

## 📊 Relatórios e Exportação
- [ ] **Geração de PDF do Livro Diário:** Um botão para compilar os diários de obra de um mês inteiro (com fotos, efetivo, clima e equipamentos em operação) em um PDF unificado, formatado nos padrões exigidos para arquivamento ou apresentação técnica.
- [ ] **Resumo Financeiro de Medições (Gráficos):** Criar um painel visual (dashboards) na aba de medições, comparando o valor total orçado vs. o valor acumulado já pago aos empreiteiros (Terraplanagem, Pavimentação, Drenagem).

## 🛡️ Auditoria e Governança (Admin)
- [ ] **Logs de Acesso (Audit Trail):** Criar uma tabela invisível no Supabase que registra cada ação crítica (ex: "Investidor X baixou o Projeto de Drenagem às 14h" ou "Corretor Y visualizou a Galeria de Fotos"). Muito útil para saber se os clientes estão acompanhando o andamento.
- [ ] **Notificações Push / E-mail:** Avisar os clientes automaticamente por e-mail ou WhatsApp (API) quando um novo relatório mensal ou projeto for liberado para a visualização deles.