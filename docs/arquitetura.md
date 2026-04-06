# Visao geral da aplicacao

A aplicacao e um gerador de curriculos em React que permite criar, editar, duplicar, excluir e exportar varios curriculos salvos localmente.

## Fluxo principal

1. `main.tsx` inicializa o React e carrega a configuracao de i18n.
2. `App.tsx` orquestra a interface principal, o formulario, a sidebar, os modais e o preview em PDF.
3. `useCVStorage.ts` mantem a lista de curriculos em memoria do estado e sincroniza com `localStorage`.
4. `CVForm.tsx` edita os dados do curriculo com `react-hook-form`.
5. `CVDocument.tsx` transforma os dados em documento PDF com `@react-pdf/renderer`.
6. `PDFPreview.tsx` mostra a pre-visualizacao do PDF na interface.

## Estrutura de estado

O estado principal e dividido em duas partes:

- lista de curriculos salvos, cada um com `id`, `title` e `updatedAt`
- curriculo ativo, usado pelo editor e pela exportacao

A persistencia usa duas chaves no navegador:

- `cv-data` para salvar a lista completa de curriculos
- `cv-selected-id` para restaurar o curriculo ativo

## Funcionalidades de produto

- criar novo curriculo com dados base
- duplicar um curriculo existente
- excluir um curriculo individual
- limpar tudo e voltar para um curriculo padrao
- editar dados pessoais, formacao, experiencia, projetos, habilidades, idiomas, soft skills, competencias interpessoais e referencias
- alternar entre portugues e ingles
- visualizar o resultado em formato A4
- baixar ou imprimir o curriculo em PDF

## Observacoes de implementacao

- O formulario usa atualizacao incremental para reduzir perda de dados durante a edicao.
- O PDF e gerado a partir do mesmo conjunto de dados do editor, evitando divergencia entre preview e exportacao.
- A aplicacao depende de `localStorage`, entao os dados ficam no proprio navegador do usuario.