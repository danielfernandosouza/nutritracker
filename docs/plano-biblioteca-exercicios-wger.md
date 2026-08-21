# Plano: expandir a biblioteca de exercícios com wger + free-exercise-db

Status: **executado em 2026-08-20** — Opção A aplicada. 27 exercícios novos importados da wger
(CC-BY-SA 4.0) e curados manualmente, adicionados em `lib/exercises.ts` (biblioteca foi de 70 para
97 exercícios). `ExerciseDef`/`Exercise` ganharam um campo `imageUrl?: string` (foto única) além do
`demoName?: string` existente (par de frames do free-exercise-db), já que a wger fornece uma foto
só por exercício — `components/ExerciseDemo.tsx` foi atualizado pra suportar os dois formatos.
Linha de crédito adicionada no rodapé da tela de Perfil. Gatilho: dia de treino "Puxar"
(costas+bíceps) só tinha 2-3 exercícios — a causa raiz real era o algoritmo de distribuição
(`allocateExerciseCounts`, corrigido antes desta expansão), mas a biblioteca também foi ampliada
já que estava sendo revisitada mesmo.

## Contexto

Hoje `lib/exercises.ts` tem 71 exercícios curados manualmente, com fotos vindas do dataset
[free-exercise-db](https://github.com/yuhonas/free-exercise-db) (usado em `lib/exercises.ts` →
`getExerciseDemoImages`). Pesquisamos duas fontes maiores pra aumentar a variedade:

- **[wger API](https://wger.de/api/v2/)** — 860 exercícios via REST, gratuita, sem autenticação
  pra leitura. Dados vêm em IDs numéricos (músculo, equipamento, categoria) que precisam ser
  cruzados com outros endpoints pra virar texto legível; maioria multi-idioma (precisa filtrar
  `language=english`, sem PT-BR nativo). Tem fotos reais em vários exercícios (não só vídeo do
  YouTube) — no formato que já usamos hoje. Licença dos dados: CC-BY-SA (exige atribuição).
- **[exercemus/exercises](https://github.com/exercemus/exercises)** — arquivo JSON estático no
  GitHub (não é API viva), código MIT, mas cada exercício individual carrega a licença do autor
  original, e o mantenedor exige mostrar "autor, licença e link" ao lado de cada exercício exibido.
  Nas amostras verificadas, boa parte não tem foto — só link de vídeo do YouTube, o que quebraria
  nosso formato atual de demo (duas fotos em crossfade, ver `components/ExerciseDemo.tsx`).

## As 3 opções consideradas

| Opção | O que muda | Custo | Risco |
|---|---|---|---|
| **A. Importar uma vez, curar e expandir nossa lista atual** | Um script roda uma vez, puxa exercícios+fotos da wger, junta com o que já temos em `lib/exercises.ts`, e some — vira dado nosso, estático, do jeito que já funciona hoje | **Baixo** — meio dia de trabalho | Baixo — zero mudança de arquitetura, zero dependência nova em produção |
| **B. Consultar a API da wger ao vivo, toda vez que a tela de treino carrega** | Rearquitetura: `workouts/page.tsx` passa a depender de uma chamada de rede externa pra montar o treino | **Alto** — vários dias (cache, tratamento de falha, junção de IDs, filtro de idioma) | Alto — se a wger cair ou ficar lenta, a tela de treino do usuário quebra |
| **C. Hospedar nosso próprio wger** (Docker) | Sobe um serviço extra (Django+Postgres próprio) só pra servir exercícios | **Muito alto** | Alto — mais uma peça de infra pra manter, exagero pro tamanho do app |

## Recomendação: Opção A

Resolve o pedido (mais variedade, base maior e curada) sem adicionar risco em produção —
continua sendo um arquivo estático, sem chamada de rede nova, sem exigir atribuição por
exercício na tela (resolve com uma linha de créditos discreta em algum rodapé/config).

## Passo a passo quando formos executar

1. Buscar `https://wger.de/api/v2/exercise/?language=2&limit=100&offset=N` paginado (language=2
   costuma ser inglês — confirmar no momento, o valor pode mudar) + `exercisecategory`,
   `muscle`, `equipment`, `exerciseimage` pra resolver os IDs em texto/URLs de foto.
2. Escrever um script único (`scripts-tmp/import-wger.ts` ou similar, descartável) que:
   - Baixa e junta esses endpoints.
   - Filtra exercícios sem imagem (nosso `ExerciseDemo` precisa de foto, não vídeo).
   - Mapeia `muscleGroup`/`equipment` da wger pro nosso enum (`lib/exercises.ts` →
     `MuscleGroup`/`Equipment`) — provavelmente precisa de uma tabela de correspondência manual,
     já que os nomes não batem 1:1.
   - Gera um bloco de entradas no formato `ExerciseDef` (mesmo shape do que já existe).
3. Revisar manualmente a lista gerada antes de colar em `lib/exercises.ts` — remover duplicatas
   do que já temos, remover exercícios muito nichados/arriscados sem supervisão (ex.: levantamentos
   olímpicos avançados), e traduzir nomes pro português como já fazemos hoje.
4. Adicionar uma linha de crédito discreta (ex. no rodapé do Perfil ou num `/sobre`) citando a
   wger (CC-BY-SA) como fonte de parte das imagens/dados.
5. Rodar `npx tsc --noEmit`, `npx eslint .`, `npm run build` como sempre.

## Por que ainda não fizemos

Priorizamos primeiro corrigir bugs ativos (câmera, timeout da IA, volume excessivo do treino
full body, login/biometria) antes de expandir dado. Essa expansão é enriquecimento, não correção
de bug — pode esperar uma sessão dedicada.
