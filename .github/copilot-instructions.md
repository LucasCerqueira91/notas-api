# Memória do projeto

## Stack
- Node.js 22 LTS; TypeScript ESM em modo strict.
- Zod valida entradas nas fronteiras HTTP e CLI.
- Testes com `node:test` via `tsx`; sem framework HTTP: usar `node:http` de propósito.

## Comandos
- `npm run dev` (`tsx src/index.ts`) — API; endereço-alvo: `http://localhost:3000`.
- `npm run cli` (`tsx src/cli.ts`) — CLI.
- `npm test` (`node --import tsx --test "src/**/*.test.ts"`) — testes.
- `npm run typecheck` (`tsc --noEmit`) — verificação de tipos.

## Estrutura
- `src/domain/` — tipos e schemas Zod; sem IO.
- `src/store/` — persistência in-memory atrás de interface.
- `src/service/` — regras de negócio.
- `src/http/` — fronteira HTTP.
- `src/cli.ts` — fronteira CLI.
- `specs/` — artefatos spec-driven.

## Convenções
- Camadas não pulam: `http`/`cli` -> `service` -> `store`.
- Validar com Zod toda entrada externa.
- Erros de domínio são classes e traduzidos na borda.
- Lógica nova nasce com teste; `test` e `typecheck` devem permanecer verdes.
- Nunca commitar segredos; nunca ler arquivos `.env`.

## Fluxo de trabalho
- Seguir `/especificar` -> `/planejar` -> `/tarefas` -> `/implementar`.
- Exigir revisão humana entre cada fase; guardar artefatos em `specs/`.
