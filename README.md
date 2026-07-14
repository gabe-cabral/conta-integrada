# Nuxt Minimal Starter

Look at the [Nuxt documentation](https://nuxt.com/docs/getting-started/introduction) to learn more.

## Setup

Make sure to install dependencies:

```bash
# npm
npm install

# pnpm
pnpm install

# yarn
yarn install

# bun
bun install
```

## Development Server

Start the development server on `http://localhost:3000`:

```bash
# npm
npm run dev

# pnpm
pnpm dev

# yarn
yarn dev

# bun
bun run dev
```

## Production

Build the application for production:

```bash
# npm
npm run build

# pnpm
pnpm build

# yarn
yarn build

# bun
bun run build
```

Locally preview production build:

```bash
# npm
npm run preview

# pnpm
pnpm preview

# yarn
yarn preview

# bun
bun run preview
```

Check out the [deployment documentation](https://nuxt.com/docs/getting-started/deployment) for more information.

## Dependencies

- [Nuxt](https://nuxt.com/) - The web framework used
- [Bootstrap](https://getbootstrap.com/) - The CSS framework used
- [MongoDB](https://www.mongodb.com/) - The database used
- [TomSelect](https://tom-select.js.org/) - The select input library used to multiple selections

## Funcionalidades

### Espaços financeiros

Os espaços organizam contas, cartões, categorias e moedas em contextos independentes, como Casa, Pessoal ou Empresa. Cada espaço possui identidade visual própria, pode limitar as categorias disponíveis e pode ser exibido como uma visão separada na página inicial.

# Recursos

## Bank Logos

- [12 countries bank logos](https://prisma.truelayer.com/assets/bank-logos/#assets)
- [Logos de bancos brasileiros](https://github.com/Tgentil/Bancos-em-SVG)

## Autenticação

- https://nuxt.com/docs/4.x/guide/recipes/sessions-and-authentication
- https://github.com/atinux/nuxt-auth-utils?tab=readme-ov-file#webauthn-passkey
- https://github.com/barbapapazes/nuxt-authorization
- https://github.com/atinux/nuxt-auth-utils/blob/main/playground/server/api/login.post.ts

## MongoDB

### Criptografia em Execução

#### Shared Library

- Informações em [Automatic Encryption Shared Library for Queryable Encryption](https://www.mongodb.com/docs/v7.0/core/queryable-encryption/reference/shared-library/#download-the-automatic-encryption-shared-library)
- [Download das DLLs](https://www.mongodb.com/try/download/enterprise-advanced/releases)
