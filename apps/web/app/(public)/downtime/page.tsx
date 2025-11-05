import { ExternalLink } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { BackButton } from '@/components/dashboard/back-button'
import { Button } from '@/components/ui/button'
import Figure from '../../../public/og_image.jpg'

export default function DowntimePage() {
  return (
    <main className="flex flex-col items-center min-h-screen px-6 py-20">
      <section className="max-w-3xl w-full pt-6 md:pt-20 text-justify flex flex-col gap-6 leading-relaxed text-sm md:text-base">
        <BackButton className="w-auto px-4 inline-flex self-start -translate-x-4" />
        <h1 className="text-2xl md:text-4xl font-semibold font-heading text-left">
          O sistema está temporariamente fora do ar
        </h1>

        <Image
          src={Figure}
          alt="Fixr Banner"
          className="w-full border border-border rounded-lg"
        />

        <p className="text-muted-foreground">
          Este é um{' '}
          <span className="font-medium text-foreground">
            projeto interdisciplinar desenvolvido na FAM (Faculdade das
            Américas)
          </span>
          . Sua infraestrutura envolve diversos serviços — como o servidor da
          API, banco de dados e sistema de cache — todos hospedados em uma{' '}
          <span className="font-medium text-foreground">VPS privada</span>.
        </p>

        <p className="text-muted-foreground">
          Como esses serviços possuem{' '}
          <span className="font-medium text-foreground">custos em dólar</span>,
          optamos por mantê-los disponíveis apenas durante o período de contexto
          e apresentações dos Projetos Integradores (PIs).
        </p>

        <p className="text-muted-foreground">
          Fora desses períodos, o backend é desativado para reduzir custos
          operacionais, permanecendo apenas o frontend acessível para fins de
          demonstração e consulta visual.
        </p>

        <p className="text-muted-foreground">
          Caso queira conhecer mais sobre o funcionamento do projeto, sua
          arquitetura e principais decisões técnicas, você pode acessar a
          documentação ou explorar os demais links disponíveis.
        </p>

        <div className="flex gap-4">
          <Link href={process.env.NEXT_PUBLIC_LINKTREE_URL ?? '/'}>
            <Button className="font-light">
              Linktree <ExternalLink className="w-5 h-5 inline-block" />
            </Button>
          </Link>
          <Link href={process.env.NEXT_PUBLIC_DOCS_URL ?? '/'}>
            <Button variant="outline" className="font-light">
              Documentação <ExternalLink className="w-5 h-5 inline-block" />
            </Button>
          </Link>
        </div>

        <p className="text-muted-foreground">
          Agradecemos sua compreensão e interesse no projeto.
        </p>

        <p>Atenciosamente, a equipe Fixr.</p>
      </section>
    </main>
  )
}
