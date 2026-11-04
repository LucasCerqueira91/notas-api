# Plano técnico: gerenciamento de tarefas

## 1. Arquitetura

O projeto é atualmente um esqueleto, com `src/index.ts` vazio e sem módulos de domínio, serviço, armazenamento ou CLI. Criar as camadas abaixo, mantendo as dependências em uma única direção:

```text
HTTP / CLI -> service -> store
                    \-> domain (tipos, schemas e erros)
```

Arquivos a criar:

- `src/domain/task.ts` — tipo `Task`, tipo de estado e schemas Zod de tarefa, título e filtro.
- `src/domain/errors.ts` — erros de domínio para tarefa não encontrada.
- `src/store/task-store.ts` — interface do armazenamento e implementação em memória, incluindo geração de ID único.
- `src/service/task-service.ts` — casos de uso para criar, listar, concluir e remover tarefas.
- `src/http/server.ts` — servidor `node:http`, parsing/validação de entradas, roteamento e tradução dos erros para respostas HTTP.
- `src/http/server.test.ts` — testes de integração HTTP.
- `src/cli.ts` — parsing/validação de argumentos, chamada do serviço e apresentação de saídas e erros.
- `src/cli.test.ts` — testes da CLI usando argumentos e streams controlados.
- `src/service/task-service.test.ts` — testes unitários dos casos de uso.
- `src/store/task-store.test.ts` — testes da implementação em memória e geração de IDs.

Alterar `src/index.ts` para iniciar o servidor HTTP, preservando a fronteira de entrada existente `npm run dev`. A CLI deve continuar acessível por `npm run cli`, que já aponta para `src/cli.ts`. Reutilizar uma fábrica de dependências/servidor para que HTTP e CLI possam compartilhar a mesma instância de serviço quando executados em testes; cada processo iniciado separadamente terá seu próprio armazenamento em memória.

## 2. Modelo de dados

Proposta de domínio:

```ts
type TaskStatus = "open" | "done";

interface Task {
  id: string;
  title: string;
  status: TaskStatus;
}

type TaskFilter = "all" | TaskStatus;
```

Schemas Zod:

- Título: string obrigatória, aparada nas extremidades e com tamanho de 1 a 200 caracteres após o trim.
- Criação: objeto contendo somente `title`.
- Filtro: enum `all`, `open` ou `done`; ausência deve ser convertida para `all` pela fronteira.
- Identificador: UUID v4, validado conforme a representação aprovada.

O armazenamento deve expor operações tipadas para inserir, listar, obter, atualizar o estado e remover por ID. O serviço aplica as regras de negócio e retorna tarefas tipadas. A geração de UUID v4 fica encapsulada no armazenamento e deve evitar colisões.

Erros previsíveis devem ser representados por classes de domínio, ao menos para ID inexistente. Dados inválidos devem ser rejeitados pelos schemas nas fronteiras HTTP e CLI antes de chamar o serviço. Não adicionar campos não previstos na spec, como datas de criação, descrição ou prioridade.

## 3. Contratos

Os contratos abaixo foram aprovados e registrados na spec.

### HTTP

| Operação | Contrato proposto | Sucesso proposto |
| --- | --- | --- |
| Criar | `POST /tasks`, JSON `{ "title": string }` | `201 Created`, JSON da tarefa com `id`, `title` e `status: "open"` |
| Listar | `GET /tasks?filter=all\|open\|done`; filtro omitido equivale a `all` | `200 OK`, JSON array de tarefas com `id`, `title` e `status`, em ordem de criação da mais antiga para a mais recente; lista vazia é `[]` |
| Concluir | `PATCH /tasks/:id/complete` | `200 OK`, JSON da tarefa concluída; chamada repetida continua retornando estado `done` |
| Remover | `DELETE /tasks/:id` | `204 No Content` |

Erros: `400 Bad Request` para JSON malformado, título inválido ou filtro inválido; `404 Not Found` para tarefa inexistente em concluir/remover. Ambos retornam JSON com mensagem explícita. Textos literais das mensagens e o formato detalhado do JSON não foram especificados.

### CLI

Usar o script existente `npm run cli` e os subcomandos aprovados:

| Operação | Forma proposta | Saída proposta |
| --- | --- | --- |
| Criar | `npm run cli -- create "<title>"` | Exibir ID, título e estado inicial |
| Listar | `npm run cli -- list [--filter all\|open\|done]` | Exibir ID, título e estado de cada tarefa; filtro omitido equivale a `all` |
| Concluir | `npm run cli -- complete <id>` | Exibir a tarefa atualizada |
| Remover | `npm run cli -- remove <id>` | Confirmar a remoção sem apresentar o item como disponível |

Saídas de sucesso devem ser texto legível. Erros devem ser escritos em `stderr`, não produzir saída de sucesso e retornar código `1`; sucesso retorna código `0`. Os textos literais das mensagens não foram especificados.

## 4. Decisões e trade-offs

- **Armazenamento em memória:** aprovado para esta entrega. Dados não sobrevivem ao encerramento do processo e HTTP/CLI executados em processos separados não compartilham tarefas; persistência durável foi excluída da spec.
- **Camadas explícitas:** serviço concentra regras reutilizadas pelas duas interfaces; store não importa HTTP ou CLI; domínio não faz IO.
- **ID único:** gerar UUID v4 por `crypto.randomUUID()` do Node no store evita duplicação de lógica entre interfaces; o formato foi aprovado como contrato externo.
- **Conclusão idempotente:** concluir uma tarefa já concluída mantém o estado e retorna o estado atual, conforme RF-9; não introduzir erro de “já concluída”.
- **Remoção:** remover de fato do store; tentativas subsequentes de concluir ou remover o mesmo ID retornam erro de tarefa não encontrada, conforme RF-11 e critérios de aceite.
- **Ordenação:** manter a ordem de criação, da mais antiga para a mais recente. O store deve preservar essa ordem sem adicionar campos públicos à tarefa.
- **Sem dependência HTTP adicional:** usar `node:http` e validadores Zod existentes, conforme a stack obrigatória.

## 5. Estratégia de testes

Usar `node:test` com `tsx`. Cobrir cada camada com dependências determinísticas/injetáveis, sem depender de relógio, rede externa ou estado compartilhado entre testes.

- **Domínio:** validar título aparado, título vazio/ausente, limites de 1 e 200 caracteres, rejeição acima de 200; validar todos os filtros e rejeitar filtro inválido.
- **Store:** criar e recuperar tarefa; garantir ID único para tarefas distintas; listar por estado e `all`; atualizar estado; remover; confirmar comportamento para ID inexistente.
- **Service:** criar tarefa aberta com título normalizado; listar sem filtro e com cada filtro; concluir tarefa aberta e repetir conclusão; concluir ID desconhecido; remover tarefa existente; confirmar que removida não aparece nem pode ser concluída.
- **HTTP:** exercitar cada endpoint proposto; verificar status e formatos de sucesso; testar filtro padrão, filtros válidos/inválidos, JSON inválido, título fora dos limites, ID inexistente e idempotência da conclusão. Usar servidor em porta efêmera e encerrá-lo em `finally`.
- **CLI:** testar cada comando com argumentos/streams isolados; conferir equivalência das operações e filtros, título inválido, ID inexistente, saída de erro em `stderr` e códigos de saída. Injetar serviço/armazenamento para não depender de processos ou dados persistentes.
- **Verificação final:** executar `npm test` e `npm run typecheck`; manter ambos verdes.

## 6. Riscos e decisões humanas

- As decisões de contrato foram aprovadas: rotas e verbos HTTP, comandos CLI, códigos de resposta/saída, UUID v4, ordenação por criação e armazenamento em memória.
- Os textos literais das mensagens de erro e detalhes do objeto JSON de erro não foram fixados; implementar mensagens explícitas sem depender de texto exato em contratos ou testes.
- A remoção de ID inexistente deve seguir a spec e responder erro de tarefa não encontrada, sem se tornar idempotente.
- A fase de decisões e registro foi concluída. A implementação deve avançar uma tarefa por vez e parar para revisão humana ao concluir uma fatia coesa.
