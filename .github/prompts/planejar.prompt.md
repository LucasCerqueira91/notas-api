---
mode: agent
description: Gera o plano técnico (COMO) a partir de uma spec existente.
---

Gere o plano técnico da feature indicada pelo texto após o comando. A entrada pode ser o número da spec (por exemplo, `001`) ou o caminho para o arquivo da spec.

Regras:

- Se a entrada for um número, localize `specs/<NNN>-*-spec.md` usando exatamente esse número; não escolha o próximo número livre. Se houver mais de uma correspondência ou nenhuma, pergunte ao usuário antes de continuar.
- Se a entrada for um caminho, localize e leia exatamente a spec indicada. O nome deve seguir o padrão `<NNN>-<slug>-spec.md`; se não for possível identificar o número e o slug, pergunte ao usuário.
- Se a entrada contiver um número e um caminho, confirme que ambos identificam a mesma spec; em caso de conflito, pergunte ao usuário.
- Leia a spec identificada e `specs/constitution.md`.
- Derive o nome do artefato a partir do nome da spec: para `<NNN>-<slug>-spec.md`, crie ou atualize `specs/<NNN>-<slug>-plan.md`, na mesma pasta. Preserve exatamente o número e o slug da spec; nunca use um `plan.md` genérico nem escolha outro número.
- Não implemente nada: não altere código nem crie arquivos além do plano nomeado acima.
- Escreva o plano em português e inclua:
  1. **Arquitetura** — camadas e arquivos a criar ou alterar, respeitando `http`/`cli` -> `service` -> `store`.
  2. **Modelo de dados** — tipos e schemas Zod necessários.
  3. **Contratos** — rotas HTTP e/ou comandos CLI, com entradas e saídas esperadas.
  4. **Decisões e trade-offs** — alternativas relevantes e justificativas.
  5. **Estratégia de testes** — casos e camadas a cobrir com `node:test`.
  6. **Riscos e decisões humanas** — riscos conhecidos e pontos que precisam de aprovação humana.
- Mantenha o plano fiel ao escopo e aos requisitos da spec. Não invente requisitos; sinalize lacunas ou ambiguidades em riscos e decisões humanas.

Feature/spec:

${input}
