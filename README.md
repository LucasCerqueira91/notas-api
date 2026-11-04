# notas-api

API HTTP e CLI para gerenciamento de tarefas, implementadas com Node.js e TypeScript.

## Pré-requisitos

- Node.js compatível com ES2022
- npm (incluído com o Node.js)

Confira as versões instaladas:

```sh
node --version
npm --version
```

## Instalação

Na pasta do projeto, instale as dependências:

```sh
npm install
```

O projeto usa [Zod](https://zod.dev/) em tempo de execução. TypeScript, `tsx` e os tipos do Node.js são dependências de desenvolvimento.

## Comandos disponíveis

| Comando | Descrição |
| --- | --- |
| `npm run dev` | Inicia a API HTTP em `http://127.0.0.1:3000`. |
| `npm run cli -- ...` | Executa os comandos da CLI: `create "<title>"`, `list [--filter all\|open\|done]`, `complete <id>` e `remove <id>`. |
| `npm test` | Executa os testes encontrados em `src/**/*.test.ts`. |
| `npm run typecheck` | Verifica os tipos TypeScript sem gerar arquivos de saída. |

Exemplos de uso:

```sh
npm run cli -- create "Preparar release"
npm run cli -- list --filter open
```

Os dados ficam em memória e não persistem após o encerramento do processo. A API e a CLI executadas separadamente têm armazenamentos independentes.

## Estrutura

```text
.
├── src/
│   ├── cli.ts
│   ├── index.ts
│   ├── domain/
│   ├── http/
│   ├── service/
│   └── store/
├── package.json
├── package-lock.json
└── tsconfig.json
```

O TypeScript está configurado em modo estrito, com módulos NodeNext e saída prevista em `dist/`. Arquivos `.env*`, `node_modules/` e `dist/` são ignorados pelo Git.
