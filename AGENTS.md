# AGENTS.md

## Contexto Do Projeto

- Stack principal: Nuxt 4, Vue 3, TypeScript, Bootstrap 5.3, Bootstrap Icons, MongoDB Atlas v8 com CSFLE e Queryable Encryption.
- Priorize recursos nativos de Node.js e do navegador antes de adicionar dependências novas.
- Evite duplicação de código. Centralize classes, utilitários, validações e scripts reutilizáveis.
- Preserve a experiência do usuário: histórico do navegador, navegação padrão, acessibilidade e estados de carregamento/erro.
- Versionamento das histórias no Azure DevOps: use o padrão `AB#{ID da história}` no título do commit para vincular a história correspondente.

### Features e User stories

Este projeto usa Azure DevOps.

Organization: `nexsolab`
Projeto padrão: `Conta Integrada`

Quando uma tarefa indicar uma história, use o MCP azure_devops para localizar a história correspondente.
Leia também a descrição da Feature e Épico associados para entender o contexto do trabalho.

> Use o MCP azure_devops e use o projeto "Conta Integrada" por padrão. **não modifique outros projetos**.

Ajuste o estado da história no Azure DevOps para refletir o progresso do trabalho.
Use os estados "Em andamento" e "Concluído" conforme apropriado.

Ao concluir um trabalho, escreva um comentário na discussão da história com a descrição do que foi feito.

## Regras De Trabalho

- Use ES2024+ e TypeScript sempre que possível.
- Siga boas práticas de SOLID e mantenha responsabilidades pequenas e explícitas.
- Reutilize padrões já existentes no projeto antes de criar uma nova abstração.
- Não introduza novas dependências de produção sem necessidade clara.
- Não altere arquivos de segredo, certificados, `.env` ou dados sensíveis sem solicitação explícita.
- Se uma mudança tocar autenticação, criptografia, banco ou segurança, valide com mais cuidado e explique o impacto.
- Quando consumir uma variável de ambiente importe o arquivo `import { env } from '~~/env';` e obtenha daí a variável. Não use `process.env` diretamente.
  - Lembre-se de criar a definição da variável no arquivo `env.ts`.

## Fluxo Recomendado

- Para iniciar leia a história, feature e épico associados.
- Antes de editar, inspecione o contexto local e localize implementações similares.
- Prefira mudanças pequenas e coesas.
- Reaproveite helpers, schemas e repositories já existentes.
- Quando criar comportamento novo, busque encaixe com os módulos compartilhados em `shared/`, `server/` e `app/`.
- Não faça commits - eu vou verificar o código após suas alterações.

## Verificação

- Para mudanças de código, rode a checagem mais próxima do impacto:
  - `npm run build` para alterações amplas de aplicação.
  - `npx nuxi typecheck` quando a mudança for majoritariamente de tipos/TS.
  - `npm run dev` apenas se precisar validar interação manualmente.
- Se a mudança afetar lint, execute a verificação de lint disponível no projeto antes de concluir.

## Convenções Do Repositório

- Mantenha componentes Vue legíveis e focados.
- Prefira nomes descritivos para schemas, repositories, composables e utilitários.
- Centralize acesso a banco, criptografia e regras de negócio em camadas próprias.
- Não sobrescreva trabalho não relacionado que já exista no workspace.
