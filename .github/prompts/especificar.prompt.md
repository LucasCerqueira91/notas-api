---
mode: agent
description: Cria a especificação (o QUE e por quê) de uma feature, sem código
---

Escreva uma especificação para a feature descrita a seguir.

Regras:

- Leia `specs/constitution.md` e respeite todos os princípios.
- Não escreva código nem defina decisões de implementação. Descreva o que o sistema deve fazer e por quê.
- Antes de criar o arquivo, examine os arquivos `specs/` e escolha o próximo número livre. Use o formato `specs/<NNN>-<slug>-spec.md`, com slug curto em kebab-case.
- Escreva a especificação em português e use exatamente estas seções, nesta ordem:
  1. Contexto e problema
  2. User Stories, no formato: "Como <papel>, quero <objetivo>, para <benefício>."
  3. Requisitos funcionais, numerados `RF-1`, `RF-2` e assim por diante
  4. Critérios de aceite, expressos em EARS: "Quando <evento>, o sistema deve <resposta>."
  5. Fora do escopo
  6. Questões em aberto
- Se houver ambiguidade que possa alterar escopo, comportamento ou critérios de aceite, pergunte ao usuário antes de finalizar a especificação. Faça uma pergunta por vez e aguarde a resposta.
- Se não houver questões em aberto, registre "Nenhuma" na seção correspondente.

Feature:

${input}
