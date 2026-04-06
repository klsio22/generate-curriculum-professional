# Dependencias e libs

Abaixo esta o proposito das bibliotecas principais usadas na aplicacao.

## Runtime

- `react`: base da interface.
- `react-dom`: renderizacao no DOM.
- `react-hook-form`: controle do formulario com boa performance.
- `react-i18next` e `i18next`: internacionalizacao da interface e dos textos do PDF.
- `@react-pdf/renderer`: renderizacao e geracao do PDF.
- `react-to-print`: suporte a impressao/fluxos de exportacao.
- `lucide-react`: icones da interface.

## Build e tooling

- `vite`: servidor de desenvolvimento e build.
- `typescript`: tipagem estatico da aplicacao.
- `eslint` e `typescript-eslint`: analise estatica e padroes de codigo.
- `@vitejs/plugin-react`: integracao do React com Vite.
- `tailwindcss` e `@tailwindcss/vite`: estilizacao utilitaria.
- `daisyui`: conjunto de componentes utilitarios sobre Tailwind.
- `globals`, `@types/react`, `@types/react-dom`, `@types/node`: tipos e ambientes auxiliares.

## Dependencias por area

### Formulario

O formulario usa `react-hook-form` e `useFieldArray` para lidar com blocos repetiveis como experiencia, formacao e projetos.

### PDF

A geracao do PDF depende de `@react-pdf/renderer` e dos estilos definidos em `src/styles/pdfStyles.ts`.

### Idiomas

A aplicacao registra os recursos de idioma em `src/i18n/config.ts` e alterna entre portugues e ingles.

### Persistencia

Nao existe dependencia externa para banco ou API. O estado fica salvo no navegador via `localStorage`.

## Observacao

O arquivo `package.json` deve ser a fonte de verdade para versoes exatas e scripts disponiveis.