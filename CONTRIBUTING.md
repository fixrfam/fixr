# Contribuindo com o Fixr

Obrigado pelo interesse em contribuir! Este documento cobre como configurar o ambiente, as convenções do projeto e como enviar alterações.

## Como rodar o projeto localmente

O Fixr é um monorepo com Bun workspaces (`apps/server`, `apps/web`, `apps/admin`, `apps/workers`, `packages/*`). Veja o `AGENTS.md` para o layout completo do projeto e referência de comandos.

### Pré-requisitos

- [Bun](https://bun.sh/) (v1.3.6 ou superior)
- [Docker](https://www.docker.com/) (para MySQL e Redis)
- [Git](https://git-scm.com/)

### Passo a passo

1. Clone o repositório e instale as dependências:

   ```bash
   git clone https://github.com/fixrfam/fixr
   cd fixr
   bun install   # também configura os hooks do Husky
   ```

2. Configure as variáveis de ambiente. Cada app/pacote tem seu próprio `.env` local (não existe um único `.env` na raiz) — copie o `.env.example` de cada um para `.env` no mesmo diretório:

   ```bash
   cp packages/db/.env.example packages/db/.env
   cp apps/server/.env.example apps/server/.env
   cp apps/web/.env.example apps/web/.env
   cp apps/workers/.env.example apps/workers/.env
   cp packages/mail/.env.example packages/mail/.env
   cp apps/admin/.env.example apps/admin/.env   # só necessário se for mexer no painel admin
   ```

   Os valores de exemplo já funcionam para desenvolvimento local; chaves de serviços externos (Resend, Google OAuth, Clerk, Cloudflare R2/Turnstile) precisam ser geradas nos respectivos painéis — veja os comentários em cada `.env.example`. As variáveis são validadas com Zod pelo pacote `@fixr/env`; o app não sobe se faltar alguma.

3. Suba o banco (MySQL) e o Redis via Docker, e rode as migrations:

   ```bash
   bun run db:start
   bun run db:migrate
   ```

4. Suba os apps em modo desenvolvimento:

   ```bash
   bun run dev         # server (3333), web (3000) e workers
   bun run dev:admin   # opcional: painel admin (6969), auth via Clerk
   ```

   - API REST: `http://localhost:3333` (docs em `/docs`)
   - Web app: `http://localhost:3000`
   - Admin panel: `http://localhost:6969`
   - Drizzle Studio: `bun run db:studio`

Antes de abrir um PR, garanta que os comandos abaixo passem:

```bash
bun run check-types
bun run lint
```

## Branches

- Alterações pequenas e autocontidas podem ser feitas diretamente na `develop`.
- Features maiores devem ficar em uma branch própria, nomeada assim:

  ```
  acao/escopo/mudanca
  ```

  Exemplo: `feat/evidences/s3-processor`

## Mensagens de commit

Os commits seguem este formato, escrito em inglês:

```
action(Scope): What has been done
```

Exemplo: `feat(Evidences): Fix processor to use the correct file reference`

- `action` em minúsculo (`feat`, `fix`, `chore`, `docs`, `refactor`, `test`, ...).
- `Scope` capitalizado, nomeando a área/módulo afetado.
- As mensagens de commit são validadas por um hook `commit-msg` (Husky); commits fora do padrão são rejeitados.

## Estilo de código

- Formatação e lint rodam via Biome, usando o preset `ultracite`. Não formate manualmente contra as regras; rode `bun run lint:write`.
- TypeScript em modo strict. Rode `bun run check-types` após alterações não triviais.
- Siga o layout de módulos e as convenções descritas no `AGENTS.md` (e em qualquer `CLAUDE.md`/`AGENTS.md` local do app ou pacote que você estiver alterando).

## Testes

Vitest está configurado em `apps/server` e `apps/workers` (`bun run test` de dentro do app). Adicione testes para novas regras de negócio quando fizer sentido, e não remova specs placeholder existentes só para passar nas checagens.

## Pull requests

1. Faça um fork do repositório (contribuidores externos) ou crie uma branch a partir da `develop` (mantenedores).
2. Mantenha os PRs focados: uma feature ou correção por PR.
3. Garanta que `check-types` e `lint` passem, e que os testes cubram mudanças relevantes de comportamento.
4. Descreva *o que* mudou e *por que* na descrição do PR.
5. Vincule a issue relacionada, se houver.

## Reportando bugs / sugerindo features

Abra uma issue no GitHub usando os templates disponíveis. Para bugs, inclua passos para reproduzir, comportamento esperado vs. atual e detalhes relevantes do ambiente.

## Código de conduta

Este projeto segue o [Código de Conduta](./CODE_OF_CONDUCT.md). Ao participar, espera-se que você o respeite.
