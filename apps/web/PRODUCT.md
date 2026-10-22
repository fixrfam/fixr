# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Primary users are employees of small and medium electronics repair shops ("assistência técnica") in Brazil, each operating their own tenant under a subdomain (`/dashboard/[subdomain]`). Roles, from the shared permissions model, are: technician, warehouse (estoquista), financial, manager, and admin, each scoped to only the functions their role needs (e.g. technicians work service orders and devices; warehouse works inventory; financial works estimates; manager and admin have broad read/write across service orders, customers, inventory, estimates, suppliers, and employees).

A customer-facing portal (clients tracking their own repair/service order) is planned but not yet built. Today, customers are informed only through automated email notifications, not through an authenticated view in this app. Do not design or imply customer-facing screens in this app until that surface is explicitly scoped.

## Product Purpose

Fixr centralizes service order (OS) management for repair shops that otherwise rely on manual processes: paper forms, disconnected spreadsheets, and ad hoc estimate tracking. It exists to reduce lost paperwork, service delays, poor visibility into repair status, and inefficient inventory control. Success means a shop can run intake, diagnosis, estimating, parts consumption, and status updates through one system instead of stitched-together manual tools.

## Positioning

Fixr's differentiator is purpose-built vertical integration for electronics repair shops specifically, not a generic ticketing tool adapted after the fact. One system ties together service orders, customer/budget estimates, parts inventory, and supplier reordering, with the workflow shaped by direct interviews with repair shop owners and technicians rather than assumptions carried over from general-purpose helpdesk or ERP software. A generic ticketing tool or spreadsheet workflow could not truthfully claim this same fit without rebuilding the domain model.

## Operating Context

- Multi-tenant: each repair shop is a company/tenant, accessed via its own subdomain.
- Core workflows live under `dashboard/[subdomain]`: service orders (list, detail, create), employees, customers, account/settings.
- Service orders carry a lifecycle status (open, in progress, completed, cancelled) and link to customers, devices, parts/services used, and generated estimates.
- Estimates are generated from the parts/services attached to a service order and checked against live inventory before approval.
- Inventory tracks stock levels and can trigger purchase orders to suppliers when parts run low.
- Automated emails notify people on service order status changes, estimate approvals, and account/registration events.
- The public marketing site and auth (login, forgot password) live in this same app, outside the authenticated dashboard.
- Legal pages (privacy policy, terms and conditions) are served as MDX content.
- Product content and UI copy are in Brazilian Portuguese (PT-BR); this is the shop-facing language and should be treated as the default for this app.

## Capabilities and Constraints

- Auth is JWT-based with refresh tokens, issued by the separate Fastify API (`apps/server`); this app consumes that API and does not own auth logic itself.
- Role-based access control is enforced by shared route rules (`@fixr/permissions`) mapping roles to permissions per route/action.
- Data tables (service orders, employees, etc.) support faceted filtering, sorting, and rich per-column operators (contains, is, is between, is empty, and similar), via a shared data-table config.
- Forms use React Hook Form with Zod validation, shared Zod schemas come from `@fixr/schemas` so frontend and backend validation stay consistent.
- Avatar upload with cropping exists for user accounts.
- Bot/spam protection uses Cloudflare Turnstile on public-facing forms.
- No billing, subscription, or pricing model exists in the codebase today; monetization/plans are an open product question, not yet implemented.
- No customer-facing authenticated surface exists yet (see Users).

## Brand Commitments

- Product name: Fixr. Public site: fixr.com.br. Docs: docs.fixr.com.br.
- Existing marketing voice (from shipped copy) is casual and confidence-first, e.g. "Simples & intuitivo", "Seu trabalho, mais fácil" — this is incumbent copy, not a directive for future copy, but should be treated as evidence of the established tone.

## Evidence on Hand

- Live production site at fixr.com.br; this is a real product now, not an academic-only exercise, even though it originated as a capstone project (Projeto Integrador, Ciência da Computação, Faculdade das Américas) and that history should not shape current design/scope decisions.
- No customer testimonials, case studies, or press are documented in-repo; do not fabricate them.
- No pricing/plan information exists; do not invent pricing.

## Product Principles

1. One shop, one system: service orders, estimates, inventory, and suppliers stay connected instead of living in separate tools.
2. Access matches role: technicians, warehouse, financial, managers, and admins each see and act on only what their function needs.
3. Status visibility reduces friction: real-time service order status and automated notifications replace manual follow-up.
4. Built from the trade, not adapted to it: workflows should reflect how small/medium repair shops actually operate, not generic helpdesk conventions.
5. PT-BR first: this app's language, tone, and content decisions default to Brazilian Portuguese for a Brazilian repair-shop audience.
