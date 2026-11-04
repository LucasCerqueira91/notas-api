# Gerenciamento de tarefas

## 1. Contexto e problema

O notas-api precisa oferecer um gerenciamento básico de tarefas para que usuários possam registrar atividades, acompanhar o que ainda está pendente, marcar atividades como concluídas e remover registros que não sejam mais necessários.

O recurso deve estar disponível por HTTP e pela CLI, com comportamento funcional equivalente entre as duas interfaces. Cada tarefa precisa ser identificável de forma inequívoca para permitir ações posteriores. A criação recebe somente um título, e as tarefas começam abertas até serem concluídas. Os dados são mantidos em memória: reiniciar o processo os elimina, e processos separados da API e da CLI não compartilham o mesmo armazenamento.

## 2. User Stories

- Como usuário, quero criar uma tarefa com um título, para registrar uma atividade que preciso acompanhar.
- Como usuário, quero listar todas as tarefas, para ter uma visão geral do que foi registrado.
- Como usuário, quero listar apenas tarefas abertas, para concentrar-me no que ainda precisa ser feito.
- Como usuário, quero listar apenas tarefas concluídas, para consultar o histórico do que já foi realizado.
- Como usuário, quero concluir uma tarefa pelo seu identificador, para registrar que a atividade foi realizada.
- Como usuário, quero remover uma tarefa pelo seu identificador, para eliminar um registro que não precisa mais ser mantido.
- Como usuário, quero executar essas operações por HTTP ou pela CLI, para usar a interface mais adequada ao meu contexto.

## 3. Requisitos funcionais

- **RF-1:** O sistema deve permitir a criação de uma tarefa informando um título.
- **RF-2:** O título deve ser obrigatório, não pode ser vazio após a remoção de espaços nas extremidades e deve possuir entre 1 e 200 caracteres após essa normalização.
- **RF-3:** Ao criar uma tarefa, o sistema deve gerar um identificador único para ela, iniciar seu estado como aberta e disponibilizar o identificador e o título no resultado da operação.
- **RF-4:** O sistema deve permitir listar tarefas por meio dos filtros `all`, `open` e `done`.
- **RF-5:** Quando nenhum filtro de listagem for informado, o sistema deve tratar a solicitação como `all`.
- **RF-6:** O filtro `all` deve retornar tarefas abertas e concluídas; o filtro `open` deve retornar somente tarefas abertas; e o filtro `done` deve retornar somente tarefas concluídas.
- **RF-7:** Os resultados de listagem devem permitir ao usuário identificar cada tarefa e visualizar seu título e estado atual.
- **RF-8:** O sistema deve permitir concluir uma tarefa informando seu identificador.
- **RF-9:** Uma tarefa concluída deve permanecer concluída quando a mesma ação for solicitada novamente, sem voltar ao estado aberto.
- **RF-10:** O sistema deve permitir remover uma tarefa informando seu identificador.
- **RF-11:** Uma tarefa removida não deve aparecer em listagens posteriores nem poder ser concluída por seu identificador.
- **RF-12:** HTTP e CLI devem disponibilizar as operações de criar, listar, concluir e remover, respeitando as mesmas regras de negócio e validações.
- **RF-13:** Quando uma entrada for inválida ou o identificador não corresponder a uma tarefa existente, a interface utilizada deve informar a falha de forma explícita e sem simular sucesso.
- **RF-14:** O identificador da tarefa deve ser um UUID v4 gerado pelo sistema.
- **RF-15:** A interface HTTP deve expor `POST /tasks` para criação, `GET /tasks?filter=all|open|done` para listagem, `PATCH /tasks/:id/complete` para conclusão e `DELETE /tasks/:id` para remoção. O filtro da listagem deve ser opcional e, quando omitido, equivaler a `all`.
- **RF-16:** A interface HTTP deve responder com `201` na criação, `200` na listagem e conclusão, `204` na remoção, `400` para entrada inválida e `404` para tarefa inexistente. Erros `400` e `404` devem retornar JSON com uma mensagem explícita.
- **RF-17:** A CLI deve oferecer os comandos `npm run cli -- create "<title>"`, `npm run cli -- list [--filter all|open|done]`, `npm run cli -- complete <id>` e `npm run cli -- remove <id>`. A saída de sucesso deve ser texto legível; erros devem ser apresentados em `stderr`.
- **RF-18:** A CLI deve retornar código de saída `0` em caso de sucesso e `1` em caso de erro.
- **RF-19:** As tarefas em listagens devem aparecer em ordem de criação, da mais antiga para a mais recente.

## 4. Critérios de aceite

- Quando o usuário enviar um título válido pela interface HTTP, o sistema deve criar uma tarefa aberta, gerar um ID único e retornar os dados necessários para identificá-la.
- Quando o usuário informar um título válido pela CLI, o sistema deve criar uma tarefa aberta, gerar um ID único e exibir os dados necessários para identificá-la.
- Quando o usuário enviar um título ausente, vazio, composto apenas por espaços ou com mais de 200 caracteres, o sistema deve rejeitar a criação e informar que o título é inválido.
- Quando o usuário listar tarefas sem informar filtro, o sistema deve retornar o mesmo conjunto correspondente ao filtro `all`.
- Quando o usuário listar tarefas com o filtro `all`, o sistema deve retornar todas as tarefas existentes, independentemente do estado.
- Quando o usuário listar tarefas com o filtro `open`, o sistema deve retornar somente tarefas existentes em estado aberto.
- Quando o usuário listar tarefas com o filtro `done`, o sistema deve retornar somente tarefas existentes em estado concluído.
- Quando o usuário informar um filtro de listagem diferente de `all`, `open` ou `done`, o sistema deve rejeitar a solicitação e informar que o filtro é inválido.
- Quando o usuário solicitar a conclusão de uma tarefa existente e aberta, o sistema deve alterar seu estado para concluído e retornar a tarefa atualizada.
- Quando o usuário solicitar a conclusão de uma tarefa já concluída, o sistema deve manter o estado concluído e não reportar uma transição de volta para aberto.
- Quando o usuário solicitar a conclusão de uma tarefa inexistente ou removida, o sistema deve rejeitar a operação e informar que a tarefa não foi encontrada.
- Quando o usuário solicitar a remoção de uma tarefa existente, o sistema deve removê-la e confirmar a operação sem expor a tarefa como ainda disponível.
- Quando o usuário solicitar a remoção de uma tarefa inexistente ou já removida, o sistema deve rejeitar a operação e informar que a tarefa não foi encontrada.
- Quando o usuário executar uma operação válida pela HTTP ou pela CLI, o sistema deve aplicar as mesmas regras de negócio e produzir dados funcionalmente equivalentes.
- Quando o usuário criar uma tarefa por HTTP, o sistema deve aceitar `POST /tasks`, retornar status `201` e disponibilizar o UUID v4, o título e o estado aberto.
- Quando o usuário listar tarefas por HTTP, o sistema deve aceitar `GET /tasks` com filtro opcional `filter`, retornar status `200` e ordenar os resultados da mais antiga para a mais recente.
- Quando o usuário concluir uma tarefa por HTTP, o sistema deve aceitar `PATCH /tasks/:id/complete` e retornar status `200`; quando removê-la, deve aceitar `DELETE /tasks/:id` e retornar status `204`.
- Quando a entrada HTTP for inválida, o sistema deve retornar status `400` e um JSON com mensagem explícita; quando o ID não corresponder a uma tarefa existente, deve retornar status `404` e um JSON com mensagem explícita.
- Quando o usuário executar um comando válido da CLI, o sistema deve usar a sintaxe definida nos requisitos e retornar código `0`; quando ocorrer erro, deve apresentar uma mensagem em `stderr` e retornar código `1`.
- Quando os processos da API ou da CLI forem reiniciados, o sistema deve iniciar com armazenamento em memória vazio, sem compartilhar dados entre processos distintos.

## 5. Fora do escopo

- Autenticação, autorização e separação de tarefas por usuário.
- Edição ou renomeação de títulos.
- Descrição, prioridade, etiquetas, prazos, recorrência ou outros atributos além de ID, título e estado.
- Estados além de aberto e concluído.
- Recuperação de tarefas removidas.
- Ordenação, paginação ou busca textual avançada.
- Persistência durável, sincronização entre processos ou armazenamento externo.
- Definição de textos literais das mensagens de erro e detalhes de apresentação além da saída textual legível da CLI e do JSON de erro com mensagem explícita.

## 6. Questões em aberto

Nenhuma.
