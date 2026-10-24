# Fiscal invoices (NF-e / NFS-e): research and proposal

> FIXR-81. Research only, no code. Written in October 2026. Fiscal rules and provider prices change often: confirm every date and price below before acting on it, and validate the tax treatment with an accountant.

## Why this is a separate project

The estimate module (FIXR-30 and FIXR-31) produces a **commercial proposal**: a PDF the client approves or rejects. It has no fiscal value. Issuing a real invoice means talking to government systems, signing XML with the company's digital certificate, following technical notes that change several times a year and storing the authorized documents. That is a different integration, with different risks, and it should not block estimates.

## What a repair shop has to issue

A repair job mixes two things that are taxed by different levels of government:

| What | Tax | Document | Who authorizes it |
| --- | --- | --- | --- |
| Labor (repair, diagnosis, cleaning) | ISS (municipal) | **NFS-e** | The municipality, now through the national NFS-e system |
| Parts applied in the repair | ICMS (state) | **NF-e** (model 55), or NFC-e (model 65) for retail sales to consumers, depending on the state | The state SEFAZ |

The basis is item 14.01 of the service list in LC 116/2003 ("conserto, restauração, manutenção [...] de máquinas, veículos, aparelhos, equipamentos [...]"), which ends with **"exceto peças e partes empregadas, que ficam sujeitas ao ICMS"**. São Paulo's tax authority confirms this reading (Resposta à Consulta 33.634/2026: ICMS falls only on the value of the parts applied, not on consumables used in the service). Some municipalities classify repair shops under 14.02 instead, and some states allow a single "conjugated" NF-e covering both (São Paulo, Portaria CAT-162/2008, when the municipality allows it).

**Consequence for Fixr:** one service order can produce **two fiscal documents** (NFS-e for labor, NF-e/NFC-e for parts). This matches how Fixr already splits items into `part` and `service` (FIXR-29), which is good news for the data model.

## Regulatory landscape (as of October 2026)

- **National NFS-e standard.** LC 214/2025 (art. 62) required every municipality to join the national NFS-e standard by 1 January 2026, either using the free national issuer or integrating its own system with the national platform. For an integrator this is a big simplification: one API (DPS sent to the national platform, NFS-e returned) instead of one integration per city. Some cities still run their own systems integrated with the national one, so a provider's municipal coverage still matters.
- **Tax reform (IBS/CBS).** LC 214/2025 (art. 60) requires the new IBS and CBS fields in electronic fiscal documents from 2026. The validation dates moved several times: for NF-e/NFC-e, Technical Note 2025.002 postponed the rejection rule; for NFS-e, Ato Conjunto RFB/CGIBS nº 4/2026 phases the obligation in by service category (01/10/2026 for most ISS services). The legal obligation exists even where the rejection rule is not active yet. Any integration built now must carry the IBS/CBS group from day one.
- **Digital certificate.** Signing and transmitting documents needs an ICP-Brasil certificate (A1 for server-side use) of the company's root CNPJ. Each shop has its own; Fixr would need one per tenant.

## Options

### A. Integrate directly with the government systems

National NFS-e API for services, plus each state's SEFAZ web services for NF-e. We would own XML generation and signing, contingency, events (cancellation, correction letter, number voiding), certificate handling and every technical note.

Not recommended: it is a full-time maintenance job for a small team, the rules are changing right now because of the tax reform, and mistakes block the shop's billing.

### B. Use a fiscal API provider (recommended)

The provider owns the government integrations; Fixr sends JSON and receives the authorized document (XML, PDF) by webhook or polling. Candidates:

| Provider | Notes |
| --- | --- |
| [Focus NFe](https://focusnfe.com.br/precos/) | Public prices: Solo R$ 94,90/month (1 CNPJ, 100 documents, R$ 0,11 per extra), Start R$ 119,90/month (3 CNPJs, R$ 39,90 per extra CNPJ), Growth R$ 572,00/month (unlimited CNPJs, 4.000 documents). NFS-e and NF-e included; 30-day trial. Claims 3.000+ municipalities and NFS-e Nacional support. |
| [NFE.io](https://nfe.io/precos/) | Strong NFS-e focus; prices on request. |
| [PlugNotas (TecnoSpeed)](https://tecnospeed.com.br/en/plugdfe/plugnotas/) | Claims 2.200+ municipalities and IBS/CBS updates; usually annual corporate contracts. |
| Nuvem Fiscal | Post-paid by volume; sandbox available. |
| eNotas, Notaas | Notaas advertises a free production tier (50 documents/month); claims from its own comparison should be verified. |

What matters most for Fixr, in order:

1. **Multi-tenant API**: create a company (CNPJ, certificate, municipal settings) per Fixr tenant through the API, and price per CNPJ that works for many small shops. This rules out plans priced for a single company.
2. **NFS-e Nacional plus coverage** of the cities where the first customers are.
3. **IBS/CBS readiness.**
4. **Webhooks** (signed) and a free sandbox for CI.
5. Certificate storage on the provider side, so the `.pfx` and its password never live in Fixr's database.

Focus NFe and Nuvem Fiscal are the first two to evaluate: public docs, public prices or post-paid volume, NFS-e Nacional support.

### C. Do not issue: export to the shop's ERP or accountant

Export the delivered service orders (items split into labor and parts, client data, totals) as CSV/XML for the shop's existing system. Cheapest first step, zero fiscal liability for Fixr, and useful even after option B exists. A reasonable MVP while option B is negotiated.

## Data Fixr is missing

**Company** (today: name, CNPJ, free-text address, contact data):
- Legal name (razão social), municipal registration (inscrição municipal), state registration (inscrição estadual, only for NF-e; many service-only shops don't have one)
- Tax regime (MEI, Simples Nacional, Lucro Presumido, Lucro Real) and CNAE
- **Structured address** with CEP, street, number, district and IBGE city code (today `companies.address` is one text field)
- ISS rate, service list item (14.01 / 14.02), municipal service code, NBS code
- The A1 certificate, stored at the provider (Fixr only keeps the provider's company id and the certificate's expiry date, to warn before it expires)

**Client** (today: name, CPF, email, phones, free-text address, city, state):
- CNPJ for business clients (today only CPF)
- Structured address (required on NF-e; optional on NFS-e for individuals in most cities)

**Parts** (today: name, SKU, price, stock):
- NCM, CFOP, origin, unit, CST/CSOSN, IBS/CBS classification (cClassTrib). Most shops would set these once per part with their accountant.

**Services**: service code (LC 116 item / municipal code / NBS) and whether ISS is withheld.

## Proposed design (option B)

- **Module `invoices`** in `apps/server`, table `fiscal_documents`: company, service order, optional estimate, type (`nfse` / `nfe`), status (`pending`, `processing`, `authorized`, `rejected`, `cancelled`), provider reference, number, access key, links to XML and PDF (copied to R2 through the existing uploads pattern), rejection reason, timestamps.
- **When to issue:** a manual "Issue invoice" action by the financial role on a delivered (or paid) service order, never automatic at first. The service is rendered at delivery, not at estimate approval. The items come from the service order (already split into parts and services), so the approved estimate's prices are reused.
- **Async flow:** the API enqueues a job (BullMQ, new `invoices` queue in `apps/workers`), the worker calls the provider, the provider answers by webhook (`POST /webhooks/fiscal/:provider`, signature checked, added to the RBAC sweep allowlist) or the worker polls. The web shows the status and the PDF.
- **Permissions:** new `invoices:read|issue|cancel` in `packages/permissions` for admin and financial.
- **Cancellation:** follows the document's rules (NF-e has a short window, NFS-e depends on the city); expose it as an event, never as a delete.
- **Config:** provider token in `@fixr/env/server`; per-company fiscal settings in a new `company_fiscal_settings` table, editable only by admins.

## Costs and legal points

- Provider fee per document and per CNPJ (see table). Decide whether Fixr absorbs it, includes a quota in the plan or charges per document.
- A1 certificate: paid yearly by each shop to a certificate authority.
- Each shop must be enabled to issue NFS-e in its city and, for NF-e, have a state registration and be accredited with its SEFAZ. Fixr cannot do this for them; onboarding needs a checklist.
- Responsibility for the tax content (rates, codes, regime) stays with the shop and its accountant; the terms of use should say so. Fixr is responsible for transmitting what the shop configured.

## Open questions

1. Do the first customers need NF-e for parts, or do they only issue NFS-e and handle parts some other way (e.g. a separate retail system)?
2. Which cities are the first customers in? This decides whether NFS-e Nacional alone is enough.
3. Who pays the provider fees?
4. Is an export (option C) enough for the first release?

## Suggested next issues

1. Fiscal settings for the company (structured address, registrations, tax regime, service codes) and structured address for clients.
2. Fiscal fields on parts and services (NCM, CFOP, service code).
3. Provider spike: sandbox account at Focus NFe and Nuvem Fiscal, issue an NFS-e in homologation from a script.
4. `invoices` module with NFS-e only (labor), behind a feature flag.
5. NF-e/NFC-e for parts.
6. Export of delivered service orders for accountants (option C), independent of the above.

## Sources

- LC 116/2003, service list item 14.01: [Netcpa, ICMS/ISS item 14.01](https://netcpa.com.br/colunas/icmsiss-fato-gerador-e-tributacao-item-1401-da-lista-de-servicos-da-lc-11603/4774)
- SEFAZ-SP, [Resposta à Consulta 33.634/2026](https://legislacao.fazenda.sp.gov.br/Paginas/RC33634_2026.aspx) and [RC 4.662/2014](https://legislacao.fazenda.sp.gov.br/Paginas/RC4662_2014.aspx)
- National NFS-e mandatory for municipalities from 2026: [Fenacon](https://fenacon.org.br/reforma-tributaria/nota-fiscal-de-servico-eletronica-nfs-e-sera-obrigatoria-a-partir-de-janeiro-de-2026/), [Contábeis](https://www.contabeis.com.br/noticias/71679/nfs-e-nacional-sera-obrigatoria-para-municipios-a-partir-de-2026/)
- National NFS-e technical documentation: [gov.br/nfse](https://www.gov.br/nfse/pt-br/biblioteca/documentacao-tecnica/manualintegradosnnfse_v1-00-02-producao.pdf)
- IBS/CBS in fiscal documents: [LegisWeb](https://www.legisweb.com.br/noticia/?id=31719), [SEFAZ-ES](https://sefaz.es.gov.br/Media/Sefaz/Links/Nota%20IBS%20CBS%20Sefaz.pdf), [IOB schedule](https://noticias.iob.com.br/reforma-cronograma-de-adequacoes/)
- Providers: [Focus NFe prices](https://focusnfe.com.br/precos/), [NFE.io](https://nfe.io/precos/), [PlugNotas](https://tecnospeed.com.br/en/plugdfe/plugnotas/), [Notaas comparison (vendor-written)](https://www.notaas.com.br/blog/post/api-emissao-nota-fiscal-comparativo-plataformas-2026/)
