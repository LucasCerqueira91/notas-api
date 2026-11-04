---
mode: agent
description: Implemente as tarefas pendentes uma a uma, com testes.
---

Implemente as tarefas do arquivo correspondente à feature indicada pelo texto após o comando. A entrada pode ser o número da spec (por exemplo, `001`) ou o caminho para o arquivo da spec.

Regras:

- Se a entrada for um número, localize `specs/<NNN>-*-spec.md` usando exatamente esse número; não escolha o próximo número livre. Se houver mais de uma correspondência ou nenhuma, pare e informe o problema.
- Se a entrada for um caminho, use exatamente a spec indicada, cujo nome deve seguir `<NNN>-<slug>-spec.md`. Se a entrada contiver número e caminho, confirme que ambos identificam a mesma spec.
- Derive os arquivos relacionados da spec: para `<NNN>-<slug>-spec.md`, leia `specs/<NNN>-<slug>-spec.md`, `specs/<NNN>-<slug>-plan.md` e `specs/<NNN>-<slug>-tasks.md`, além de `specs/constitution.md` e das instruções aplicáveis em `.github/`.
- Se a feature ou os arquivos necessários não puderem ser localizados, ou houver conflito entre os artefatos, pare e informe o problema.
- Trabalhe em uma tarefa por vez:
  1. Escolha a próxima tarefa marcada `- [ ]` cujas dependências estejam concluídas.
  2. Implemente-a de acordo com o plano, as instruções aplicáveis e a constituição; mantenha a alteração pequena e focada.
  3. Escreva ou atualize os testes relacionados e execute `npm run test` e `npm run typecheck`.
  4. Marque a tarefa como `- [x]` somente se ambos os comandos passarem. Se algum falhar, não marque como concluída; investigue e reporte o resultado.
- Nunca desative ou enfraqueça testes ou verificações de tipos para obter sucesso.
- Se a spec estiver incorreta ou uma decisão necessária não estiver especificada, pare sem improvisar e informe o que precisa ser corrigido ou decidido.
- Pare após concluir uma fatia coesa adequada para revisão humana; resuma as alterações, os testes executados e a próxima tarefa pendente. Não avance automaticamente para outra fatia.

Feature:

${input}
