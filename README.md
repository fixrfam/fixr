## Fixr - O jeito fácil de gerenciar sua assistência técnica

![Banner](https://wqys0fziog.ufs.sh/f/itbpE5hD7PnqgWWYtuk8FHtl3sLyqWjV6ngAihdeOK7xU0CP)

O **Fixr** é uma aplicação web desenvolvida para o gerenciamento de ordens de serviço em assistências técnicas. O projeto tem como objetivo otimizar processos internos, centralizar informações e facilitar o acompanhamento de serviços, oferecendo uma solução completa para empresas do setor.

A aplicação foi idealizada a partir de entrevistas com profissionais da área de eletroeletrônicos, realizadas com o propósito de compreender as principais dificuldades enfrentadas por empresas de pequeno e médio porte. A partir dessas entrevistas, foram definidos os requisitos funcionais e não funcionais do sistema, elaborados os modelos de banco de dados (conceitual, lógico e físico) e desenvolvido um protótipo de interface utilizando a ferramenta Figma.

O **Fixr** foi desenvolvido como parte da disciplina de **Projeto Integrador** do curso de **Ciência da Computação** da **Faculdade das Américas (FAM)**, aplicando tecnologias modernas e práticas consolidadas de desenvolvimento web para garantir segurança, desempenho e escalabilidade.

> [!NOTE]  
> **Acesse o projeto agora mesmo: [https://fixr.com.br](https://fixr.com.br)**

#### Criado com

[![Next.js](https://img.shields.io/badge/Next.js-black?logo=next.js&logoColor=white)](https://nextjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-6DA55F?logo=node.js&logoColor=white)](https://nodejs.org/)
[![Fastify](https://img.shields.io/badge/-Fastify-000000?style=flat&logo=fastify&logoColor=white)](https://www.fastify.io/)
[![MySQL](https://img.shields.io/badge/MySQL-4479A1?logo=mysql&logoColor=fff)](https://www.mysql.com/)
[![Redis](https://img.shields.io/badge/Redis-DC382D?logo=redis&logoColor=fff)](https://redis.io/)
[![Turborepo](https://img.shields.io/badge/Turborepo-000000?logo=turborepo&logoColor=fff)](https://turborepo.org/)
[![Docker](https://img.shields.io/badge/Docker-2496ED?logo=docker&logoColor=fff)](https://www.docker.com/)
[![JWT](https://img.shields.io/badge/JWT-000000?logo=jsonwebtokens&logoColor=fff)](https://jwt.io/)
[![React](https://img.shields.io/badge/React-%2320232a.svg?logo=react&logoColor=%2361DAFB)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=fff)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-%2338B2AC.svg?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Drizzle](https://img.shields.io/badge/Drizzle-C5F74F?logo=drizzle&logoColor=000)](https://orm.drizzle.team/)
[![BullMQ](https://img.shields.io/badge/BullMQ-FF0000?logo=bullmq&logoColor=fff)](https://docs.bullmq.io/)
[![Zod](https://img.shields.io/badge/Zod-326CE5?logo=zod&logoColor=fff)](https://zod.dev/)
[![React Hook Form](https://img.shields.io/badge/React%20Hook%20Form-EC5990?logo=reacthookform&logoColor=fff)](https://react-hook-form.com/)
[![shadcn/ui](https://img.shields.io/badge/shadcn%2Fui-000?logo=shadcnui&logoColor=fff)](https://ui.shadcn.com/)
[![Swagger](https://img.shields.io/badge/Swagger-85EA2D?logo=swagger&logoColor=000)](https://swagger.io/)
[![Scalar UI](https://img.shields.io/badge/Scalar%20UI-000000?logo=scalar&logoColor=fff)](https://scalar.so/)

---

### Sumário

- [Objetivo](#objetivo)
- [Arquitetura](#arquitetura)
- [Funcionalidades Principais](#funcionalidades-principais)
- [Tecnologias Utilizadas](#tecnologias-utilizadas)
- [Estrutura do Repositório](#estrutura-do-repositório)
- [Documentação da API](#documentação-da-api)
- [Como Executar o Projeto](#como-executar-o-projeto)
- [Equipe, Artigos e Referências](#equipe-artigos-e-referências)

---

### Objetivo

O gerenciamento de ordens de serviço em assistências técnicas enfrenta diversos desafios, especialmente em empresas de pequeno e médio porte que ainda utilizam processos manuais. Entre os problemas mais comuns estão a perda de formulários, atrasos no atendimento, dificuldade de acompanhamento do status de reparos e controle ineficiente de estoque.

O **Fixr** foi desenvolvido para superar essas limitações, oferecendo uma **plataforma centralizada** que integra o gerenciamento de ordens de serviço, controle de estoque e geração de orçamentos. O sistema permite que técnicos e clientes acompanhem o progresso das ordens em tempo real, além de automatizar o registro de peças utilizadas e pedidos de compra junto a fornecedores, promovendo maior eficiência operacional.

Além disso, o Fixr implementa um **modelo de permissões de acesso** que organiza os usuários em diferentes níveis funcionais, garantindo segurança e flexibilidade no uso da plataforma pelos setores de atendimento, laboratório e administração.

---

### Arquitetura

O **Fixr** adota uma arquitetura moderna, organizada em um **monorepo** que centraliza frontend, backend e pacotes compartilhados, permitindo **reuso de código, consistência entre aplicações e automação de tarefas** por meio do **Turborepo**.

A estrutura principal do repositório é:

```
apps/
 ├─ web/       → Aplicação principal para clientes e técnicos (Next.js)
 ├─ admin/     → Painel administrativo interno para gerentes e administradores
 └─ server/    → API REST em Fastify, responsável por toda a lógica de negócios e integração com o banco de dados

packages/
 ├─ db/        → Schemas, migrações e conexão com o banco de dados (Drizzle ORM + MySQL)
 ├─ schemas/   → Schemas Zod compartilhados entre frontend e backend para validação consistente
 ├─ constants/ → Constantes e enums do sistema
 └─ mail/      → Templates de email em React e configuração da fila de processamento com BullMQ
```

#### Backend

O servidor é construído com **Fastify**, garantindo alta performance e baixo overhead em requisições HTTP. A comunicação com o banco de dados é feita através do **Drizzle ORM**, enquanto **Redis** é utilizado para cache e armazenamento temporário de jobs. Operações pesadas, como envio de emails ou importação de grandes volumes de funcionários, são processadas de forma assíncrona com **BullMQ**, garantindo respostas rápidas no frontend.

A autenticação é realizada via **JWT**, com suporte a **refresh tokens**, garantindo segurança e controle de acesso baseado em permissões definidas por cargo.

#### Frontend

O frontend é desenvolvido em **Next.js**, oferecendo renderização híbrida (**SSR**, **ISR**) para melhor desempenho e experiência do usuário. Ele consome a API REST, exibindo informações em interfaces intuitivas e responsivas, compatíveis com dispositivos móveis.

#### Infraestrutura

Toda a aplicação é conteinerizada com **Docker**, facilitando deploy e escalabilidade. A API é documentada com **OpenAPI**, permitindo integração e testes automatizados, utilizando **Swagger** e **Scalar UI** para visualização interativa.

---

### Funcionalidades Principais

- **Gerenciamento de Ordens de Serviço (OS)**
  Permite criar, atualizar e acompanhar ordens de serviço com registro completo de histórico, controle de status (aberta, em andamento, concluída ou cancelada) e informações detalhadas sobre clientes, serviços e produtos utilizados.

- **Criação de Orçamentos e Controle de Peças**
  Gera orçamentos automaticamente com base nas peças e serviços vinculados a cada OS, garantindo precisão nos custos e verificando a disponibilidade em estoque antes da aprovação.

- **Gestão de Estoque e Fornecedores**
  Controla entradas, saídas e níveis de estoque de produtos, permitindo a criação automática de pedidos de compra quando peças estão em falta, otimizando a reposição e evitando interrupções nos serviços.

- **Controle de Acesso e Permissões**
  Implementa papéis e permissões detalhados (administrador, gerente, técnico, financeiro, estoquista), garantindo que cada usuário tenha acesso apenas às funções relevantes à sua função, aumentando a segurança e a organização do fluxo interno.

- **Acompanhamento em Tempo Real**
  Técnicos e clientes podem acompanhar o progresso das OS em tempo real, visualizando atualizações automáticas de status e informações relevantes, reduzindo falhas de comunicação e agilizando o atendimento.

- **Notificações Automáticas**
  Envia emails automáticos para atualização de status, aprovações de orçamentos e confirmações de cadastro, mantendo clientes e colaboradores sempre informados sem a necessidade de contato manual.

---

### Tecnologias Utilizadas

O **Fixr** foi desenvolvido utilizando tecnologias modernas e consolidadas, que garantem **desempenho, escalabilidade e segurança** em todas as camadas da aplicação.

#### Frontend

- [**Next.js**](https://nextjs.org/): Framework React para renderização híbrida (SSR/ISR), otimizando performance e SEO.
- [**React**](https://react.dev/): Biblioteca para construção de interfaces dinâmicas e reutilizáveis.
- [**TailwindCSS**](https://tailwindcss.com/): Framework utilitário para estilização rápida e consistente, com foco em responsividade.
- [**shadcn/ui**](https://ui.shadcn.com/): Componentes prontos e personalizáveis para acelerar a construção de interfaces.
- [**React Hook Form**](https://react-hook-form.com/): Gerenciamento eficiente de formulários e validação de dados.
- [**Zod**](https://zod.dev/): Validação de dados em frontend, garantindo consistência com a API.

#### Backend

- [**Node.js**](https://nodejs.org/): Ambiente de execução rápido e escalável para o servidor.
- [**Fastify**](https://www.fastify.io/): Framework leve e de alta performance para construção da API REST.
- [**Drizzle ORM**](https://orm.drizzle.team/): Mapeamento objeto-relacional para MySQL, simplificando consultas e migrações.
- [**MySQL**](https://www.mysql.com/): Banco de dados relacional confiável para armazenar informações estruturadas.
- [**Redis**](https://redis.io/): Cache em memória e armazenamento de dados temporários para otimização de desempenho.
- [**BullMQ**](https://docs.bullmq.io/): Gerenciamento de filas para processamento assíncrono de tarefas pesadas.
- [**JWT (JSON Web Tokens)**](https://jwt.io/): Autenticação segura baseada em tokens de acesso e refresh tokens.
- [**Zod**](https://zod.dev/): Validação de dados no backend, garantindo integridade das informações recebidas.
- [**Swagger**](https://swagger.io/): Documentação interativa da API para testes e integração.
- [**Scalar UI**](https://scalar.so/): Interface gráfica para visualização e interação com a documentação da API.

#### Infraestrutura

- [**Docker**](https://www.docker.com/): Conteinerização completa do ambiente de desenvolvimento e produção.
- [**Turborepo**](https://turbo.build/repo): Orquestração de monorepo, compartilhamento de pacotes e automação de tarefas de build e deploy.
- [**TypeScript**](https://www.typescriptlang.org/): Tipagem estática para maior segurança e manutenção do código.

---

### Estrutura do Repositório

O repositório do **Fixr** segue uma organização em **monorepo**, separando claramente frontend, backend e pacotes compartilhados, facilitando o desenvolvimento, reuso de código e manutenção.

```bash
fixr/
├─ apps/
│  ├─ web/        # Aplicação principal para usuários e clientes, desenvolvida em Next.js
│  ├─ admin/      # Painel administrativo interno, destinado a gerentes e administradores
│  └─ server/     # API REST construída com Fastify, responsável pela lógica de negócios e integração com o banco de dados
│
├─ packages/
│  ├─ db/         # Schemas, conexões e migrações do banco de dados (Drizzle + MySQL)
│  ├─ schemas/    # Schemas Zod compartilhados entre frontend e backend para validação consistente
│  ├─ constants/  # Constantes globais e enums do sistema
│  └─ mail/       # Templates de e-mail em React e configuração da fila de envio com BullMQ
│
└─ turbo.json     # Configuração do Turborepo para orquestração de pacotes e tarefas
```

Essa estrutura permite:

- Desenvolvimento independente de frontend e backend.
- Reuso de código e validações compartilhadas.
- Escalabilidade e organização de tarefas via Turborepo.

---

### Documentação da API

A API do **Fixr** é totalmente documentada seguindo o padrão **OpenAPI 3.0**, garantindo **clareza, consistência e facilidade de integração** com outras aplicações.

Os principais pontos de acesso à documentação são:

- **Scalar UI:** `/docs` – Interface interativa para exploração e testes da API.
- **Swagger Reference:** `/reference` – Referência completa com detalhes de endpoints, parâmetros e respostas.

A documentação é projetada para facilitar futuras **integrações com ERPs e outros sistemas externos**, permitindo que usuários com perfil de gerente possam gerar **API tokens** diretamente pelo painel administrativo, garantindo segurança e controle de acesso granular.

---

### Como Executar o Projeto

Para rodar o **Fixr** localmente, você precisará ter instalados em sua máquina:

- [Docker](https://www.docker.com/)
- [Git](https://git-scm.com/)
- [Node.js](https://nodejs.org/)

#### Passos

1. Clone o repositório:

```bash
git clone https://github.com/fixrfam/fixr
cd fixr
```

2. Instale as dependências de todos os apps e pacotes:

```bash
npm install
```

3. Duplique o arquivo `.env.example` e preencha as variáveis de ambiente conforme indicado. As chaves do **Resend**, **Clerk** e **Google OAuth** devem ser obtidas nos respectivos serviços.

---

#### Variáveis Globais

Essas variáveis são usadas tanto pelo **Docker Compose** quanto pelos apps, sendo interpoladas, por exemplo, na conexão com o banco de dados:

```env
MYSQL_ROOT_PASSWORD="docker"
MYSQL_DATABASE="fixr"
MYSQL_USER="fixr"
MYSQL_PASSWORD="fixr"

REDIS_PASSWORD="docker"

# Não altere estas linhas
REDIS_URL="redis://default:${REDIS_PASSWORD}@localhost:6379/0"
DB_URL="mysql://${MYSQL_USER}:${MYSQL_PASSWORD}@localhost:3306/${MYSQL_DATABASE}"
```

#### Variáveis do Servidor

```env
FRONTEND_URL="http://localhost:3000"

RESEND_KEY="re_{$}"

JWT_SECRET=""
COOKIE_ENCRYPTION_SECRET=""
COOKIE_DOMAIN="localhost"

GOOGLE_AUTH_CLIENT_ID=""
GOOGLE_AUTH_CLIENT_SECRET=""
GOOGLE_AUTH_REDIRECT_URI="http://localhost:3333/auth/google/callback"

NODE_PORT="3333"
```

#### Variáveis do Web App

```env
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NEXT_PUBLIC_API_URL="http://localhost:3333"
NEXT_PUBLIC_DOCS_URL="https://docs.fixr.com.br"
NEXT_PUBLIC_LINKTREE_URL="https://linktr.ee/fixrfam"
```

#### Variáveis do Painel Admin

```env
NEXT_PUBLIC_API_URL="http://localhost:3333"
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_{$}"
CLERK_SECRET_KEY="sk_test_{$}"
```

---

#### Inicializando o Projeto

1. Crie os containers com Docker:

```bash
docker compose up -d
```

2. Rode as migrations para criar as tabelas no banco:

```bash
npm run migrate
```

3. Inicie os apps:

```bash
npm run dev
```

Optionally, if you want to have auto formatting and linting suggestions on your ide, install the **BiomeJS** extension on your preferred IDE:

- VSCode: [BiomeJS Extension](https://marketplace.visualstudio.com/items?itemName=biomejs.biome)
- IntelliJ: [BiomeJS Plugin](https://plugins.jetbrains.com/plugin/22761-biome)
- Zed: Just search for Biome in the extensions panel

More details on IDE linting support here: [https://biomejs.dev/guides/editors/first-party-extensions/](https://biomejs.dev/guides/editors/first-party-extensions/)

Also, if you want to fix Git Blame to ignore formatting commits, you can add the following to your global git config:

```sh
git config --global blame.ignoreRevsFile .git-blame-ignore-revs
```

## Customization

#### Referências

1. KOIVISTO, Elma. _Implementation of an Internal Order Management System_. Bachelor of Engineering Industrial. 2023 março. [Disponível aqui](https://www.theseus.fi/bitstream/handle/10024/793127/Koivisto_Elma.pdf?sequence=4).
2. Equipe TOTVS, et al. _Software de controle de estoque, o que é, tipos e como escolher_. 2022. [Disponível aqui](https://bit.ly/3V2BbGw).
3. DUMAS, Marlon; LA ROSA, et al. _Fundamentals of Business Process Management_. 2. ed. Berlin: Springer, 2013. [Disponível aqui](https://bit.ly/3NxT1fM).
4. GARCIA-MOLINA, Hector; ULLMAN, et al. _Database Systems: The Complete Book_. 2. ed. Upper Saddle River: Pearson Prentice, 2001. [Disponível aqui](https://bit.ly/3NyBDYs).
5. REIS, Claudio Francisco dos. _Sistema de Ordem de Serviço_. Assis: Fundação Educacional do Município de Assis – FEMA, 2010. Trabalho de Conclusão de Curso (Graduação). [Disponível aqui](https://go.ricardo.gg/fixrosclaudio).
6. FU, Jamie; LIU, Katherine; LIU, Richard; WONG, Anna. _JWT Web Security: 6.857 Final Project_. Cambridge, MA: MIT, 2022. [Disponível aqui](https://go.ricardo.gg/fixrjwtmit).
7. TOTVS. _Saiba tudo sobre sistema para assistência técnica_. 15 jun. 2020. [Disponível aqui](https://go.ricardo.gg/fixrtotvsast).
8. HARSH, Kumar. _O que é Arquitetura de Aplicativos Web? Quebrando um aplicativo da Web_. Kinsta, 17 jan. 2025. [Disponível aqui](https://go.ricardo.gg/fixrarqweb).
9. MICROSOFT. _Estilo de arquitetura Queue-Worker Web_. Azure Architecture Center, 2025. [Disponível aqui](https://go.ricardo.gg/fixrwebqueue).
