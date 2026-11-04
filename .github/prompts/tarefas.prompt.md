---
mode: agent
description: Quebra o plano em tarefas pequenas, ordenadas e testáveis
---

Gere a lista de tarefas para a feature indicada pelo texto após o comando. A entrada pode ser o número da spec (por exemplo, `001`) ou o caminho para o arquivo da spec.

Regras:

- Se a entrada for um número, localize `specs/<NNN>-*-spec.md` usando exatamente esse número; não escolha o próximo número livre. Se houver mais de uma correspondência ou nenhuma, pergunte ao usuário antes de continuar.
- Se a entrada for um caminho, localize e leia exatamente a spec indicada. O nome deve seguir o padrão `<NNN>-<slug>-spec.md`; se não for possível identificar o número e o slug, pergunte ao usuário.
- Se a entrada contiver um número e um caminho, confirme que ambos identificam a mesma spec; em caso de conflito, pergunte ao usuário.
- Derive os nomes da spec: para `<NNN>-<slug>-spec.md`, leia `specs/<NNN>-<slug>-spec.md` e `specs/<NNN>-<slug>-plan.md`, e crie ou atualize `specs/<NNN>-<slug>-tasks.md`. Preserve exatamente o número e o slug; nunca use nomes genéricos como `spec.md`, `plan.md` ou `tasks.md` se houver artefatos numerados.
- Se a spec ou o plano correspondente não puder ser localizado, pergunte ao usuário antes de continuar; não substitua por artefatos de outra feature.
- Não implemente nada nem altere outros arquivos além do arquivo de tarefas nomeado acima.
- Liste as tarefas em ordem de dependência. Cada tarefa deve:
  - começar com `- [ ]`;
  - ser pequena o suficiente para caber em um único commit;
  - ter um critério claro de pronto, verificável (por exemplo, um teste específico passa);
  - declarar as dependências, quando houver.
- Mantenha as tarefas fiéis ao escopo da spec e do plano. Não invente requisitos nem decisões de implementação.

Feature:

${input}
