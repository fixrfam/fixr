# Authentication Boilerplate Monorepo

A starting point for custom authentication without magic libraries. This monorepo provides:

- A **Fastify API** using JWT refresh tokens, accepting credentials via the `Authorization` header or a `token` cookie.
- A **Next.js 14 Frontend** with server/client authentication, middleware revalidation, and Axios interceptors.
- Shared [Zod](https://zod.dev) schemas via the `@fixr/schemas` package.
- Turborepo for local package sharing and scripting.

### Powered by:

![TypeScript](https://img.shields.io/badge/TypeScript-3178C6.svg?style=for-the-badge&logo=TypeScript&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js-000000.svg?style=for-the-badge&logo=nextdotjs&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-5FA04E.svg?style=for-the-badge&logo=nodedotjs&logoColor=white)
![Fastify](https://img.shields.io/badge/Fastify-000000.svg?style=for-the-badge&logo=Fastify&logoColor=white)
![Turborepo](https://img.shields.io/badge/Turborepo-EF4444.svg?style=for-the-badge&logo=Turborepo&logoColor=white)
![React](https://img.shields.io/badge/React-61DAFB.svg?style=for-the-badge&logo=React&logoColor=black)
![React Hook Form](https://img.shields.io/badge/React%20Hook%20Form-EC5990.svg?style=for-the-badge&logo=React-Hook-Form&logoColor=white)
![Zod](https://img.shields.io/badge/Zod-3E67B1.svg?style=for-the-badge&logo=Zod&logoColor=white)
![Axios](https://img.shields.io/badge/Axios-5A29E4.svg?style=for-the-badge&logo=Axios&logoColor=white)
![Swagger](https://img.shields.io/badge/Swagger-85EA2D.svg?style=for-the-badge&logo=Swagger&logoColor=black)
![Scalar](https://img.shields.io/badge/Scalar-1A1A1A.svg?style=for-the-badge&logo=Scalar&logoColor=white)
![Resend](https://img.shields.io/badge/Resend-000000.svg?style=for-the-badge&logo=Resend&logoColor=white)
![.ENV](https://img.shields.io/badge/.ENV-ECD53F.svg?style=for-the-badge&logo=dotenv&logoColor=black)
![Drizzle](https://img.shields.io/badge/Drizzle-C5F74F.svg?style=for-the-badge&logo=Drizzle&logoColor=black)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1.svg?style=for-the-badge&logo=PostgreSQL&logoColor=white)
![Redis](https://img.shields.io/badge/Redis-FF4438.svg?style=for-the-badge&logo=Redis&logoColor=white)

## API

Built with [Fastify](https://www.fastify.io), the API handles auth using:

- **Type Validation:** [Zod](https://zod.dev)
- **ORM:** [Drizzle](https://orm.drizzle.team) with [PostgreSQL](https://www.postgresql.org)
- **Mailing:** [Resend](https://resend.com) & [React Email](https://react.email)
- **Encryption:** [bcrypt](https://www.npmjs.com/package/bcrypt)
- **Caching:** [Redis](https://redis.io)

Documentation is available on the following API routes:

- [Scalar UI](https://scalar-ui.com) for a modern interface at `/docs`
- [Swagger](https://swagger.io) for the classic one at `/reference`

## Frontend

The frontend leverages [Next.js 14](https://nextjs.org) for seamless server/client authentication, with revalidation in middleware and auth interceptors powered by [Axios](https://axios-http.com).

## Authentication Flow

Users authenticate via JWT refresh tokens. Supported actions include:

- Password reset (authenticated and "forgot password")
- Email confirmation before signup
- Account deletion
- Display name updates

![Authentication Flow](apps/server/src/public/flux.svg)

## Setup

Begin by configuring your environment. Rename and update the provided `.env.example` files:

- **Global secrets:** [.env.example](.env.example) for DB, Redis, etc.
- **API secrets:** [apps/server/.env.example](apps/server/.env.example) for JWT signing keys and API keys.
- **Next.js variables:** [apps/web/.env.example](apps/web/.env.example).
- **Admin dashboard secrets:** [apps/admin/.env.example](apps/admin/.env.example).

Next, spin up your Postgres and Redis databases with Docker Compose:

```sh
docker compose up
```

Install dependencies and run database migrations:

```sh
npm install
npm run migrate
```

Finally, start the development server:

```sh
npm run dev
```

## Customization

Every aspect of this boilerplate can be customized to fit your needs. For example, you can:

- Customize the `APP_NAME` in [packages/constants/src/app.ts](packages/constants/src/app.ts) which will be used in mailing, docs and some UI components.
- Change the "Logo" to anything you like
    - Web logo in: [apps/web/public/logo.svg](apps/web/public/logo.svg)
    - Server logos in: [apps/server/src/public/logo.png](apps/server/src/public/logo.png) and [apps/server/src/public/favicon.svg](apps/server/src/public/favicon.svg)
        > Logos won't load on emails on development server because email clients can't access your localhost. On the production server, they will work fine.
- Customize every aspect of the UI Components in the [apps/web/components](apps/web/components) directory ([https://ui.shadcn.com/](shadcn/ui) btw).
- Customize the mailing templates in the [apps/server/src/emails](apps/server/src/emails) directory using [https://react.email/](React Email).
- Change docs theme and colors in the [apps/server/src/server.ts](apps/server/src/server.ts) file according to [https://github.com/scalar/scalar/blob/82c8f39c5f390ced5d8406bfb0b23623575fb85e/documentation/themes.md](Scalar UI themes).
