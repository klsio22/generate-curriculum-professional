# Componentes

Este documento descreve a responsabilidade de cada componente em `src/components` e dos modulos centrais relacionados.

## App.tsx

Componente raiz da interface.

Responsabilidades:

- carregar o estado de curriculos via `useCVStorage`
- controlar o curriculo ativo
- abrir e fechar a sidebar em telas pequenas
- exibir modais de confirmacao para exclusao e limpeza
- conectar o formulario ao preview e ao PDF
- coordenar a exportacao com `PDFDownloadLink` e `react-to-print`

## CVForm.tsx

Formulario principal de edicao do curriculo.

Responsabilidades:

- editar dados pessoais
- editar objetivo profissional
- adicionar e remover blocos repetiveis de experiencia, formacao e projetos
- editar competencias tecnicas, idiomas, soft skills, competencias interpessoais e referencias
- disparar salvamento automatico no blur dos campos

Dependencias principais:

- `react-hook-form`
- `useFieldArray`
- `i18next` para textos traduzidos

## CVDocument.tsx

Representacao do curriculo em PDF.

Responsabilidades:

- converter `CVData` em um documento pronto para exportacao
- renderizar secoes condicionais conforme os dados preenchidos
- formatar links externos e textos multi-linha
- aplicar estilos de PDF via `pdfStyles.ts`

## PDFPreview.tsx

Container do preview do PDF.

Responsabilidades:

- renderizar o documento em um `PDFViewer`
- mostrar o curriculo em formato visual semelhante ao PDF final
- servir como preview central da area lateral direita da tela

## Sidebar.tsx

Painel lateral de gerenciamento de curriculos.

Responsabilidades:

- listar curriculos salvos
- selecionar curriculo ativo
- criar novo curriculo
- duplicar curriculo
- solicitar exclusao de um curriculo
- solicitar limpeza total dos dados
- lidar com comportamento responsivo em tela menor

## Modal.tsx

Dialogo generico de confirmacao.

Responsabilidades:

- exibir confirmacoes de exclusao e limpeza
- fechar com clique fora ou tecla Escape
- renderizar titulo, conteudo e acoes de confirmar/cancelar

## LanguageSelector.tsx

Seletor de idioma da interface.

Responsabilidades:

- alternar entre `pt-BR` e `en`
- persistir a escolha no `localStorage`
- refletir o idioma ativo na interface

## useCVStorage.ts

Hook de persistencia e CRUD de curriculos.

Responsabilidades:

- carregar dados iniciais do `localStorage`
- criar curriculos com dados padrao
- duplicar curriculos existentes
- atualizar curriculos
- excluir curriculos
- limpar tudo e reconstruir o estado inicial

## defaultCV.ts

Dados iniciais usados como base para novos curriculos.

Responsabilidades:

- fornecer um exemplo completo de preenchimento
- servir como fallback quando nao ha dados salvos

## pdfStyles.ts

Estilos dedicados ao PDF.

Responsabilidades:

- definir tipografia, espaco e hierarquia visual do documento
- manter o layout do PDF separado do CSS da interface web

## textUtils.ts

Utilitarios de texto usados principalmente no PDF.

Responsabilidades:

- normalizar datas
- normalizar URLs antes de gerar links clicaveis
- aplicar quebra/truncamento simples em textos longos