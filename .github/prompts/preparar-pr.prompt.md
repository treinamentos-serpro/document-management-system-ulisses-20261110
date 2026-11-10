---
description: Prepara a branch para Pull Request: roda os testes do backend, revisa o diff e gera a descrição do PR.
name: preparar-pr
agent: agent
---

# Preparar Pull Request

Prepare a branch atual para abertura de Pull Request seguindo estes passos:

1. Rode os testes do backend com `cd backend && npm test` e reporte o resultado. Se falharem, indique os testes com erro e pare aqui.
2. Analise o diff em relação à `main` (`git diff main...HEAD`) e verifique:
   - Respeito ao fluxo `routes -> controllers -> services -> repositories`.
   - Uploads gravados apenas no filesystem local (`backend/storage`), sem serviços externos.
   - Erros tratados nos limites do sistema (entrada HTTP e leitura/escrita de arquivos).
   - Arquivos temporários, segredos ou artefatos gerados que não deveriam ser commitados.
3. Gere a descrição do PR em português com as seções:
   - **Resumo**: o que muda e por quê, em até três frases.
   - **Mudanças principais**: lista por camada ou componente.
   - **Como testar**: passos e comandos para validar manualmente.
   - **Pontos de atenção**: riscos, decisões e itens pendentes.

Não crie o PR automaticamente. Apresente a descrição para revisão antes de abri-lo.
