# Memória do Projeto meUrbanismo
(Mantenha este arquivo conciso. Registre apenas decisões arquiteturais e lições críticas).

- **Banco de Dados:** Estamos usando um Supabase novo. O banco inicia vazio, então novas lógicas devem prever a criação de tabelas ou tratamento de banco vazio.
- **Migração Lovable:** Estamos mesclando lógicas antigas (do Lovable) em uma nova interface no Cursor. Priorize manter o design moderno (Tailwind) ao importar funções antigas.