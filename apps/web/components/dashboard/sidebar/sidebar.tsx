'use client'

import { userJWT } from '@fixr/schemas/auth'
import { PanelLeft, Search } from 'lucide-react'
import { z } from 'zod'
import { Avatar } from '@/components/account/profile-avatar'
import { ModeToggle } from '@/components/mode-toggle'
import { TextLogo } from '@/components/svg/TextLogo'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useSidebarStore } from '@/lib/hooks/stores/use-sidebar-store'
import { useMediaQuery } from '@/lib/hooks/use-media-query'
import { cn } from '@/lib/utils'
import { AccountPopover } from '../account-popover'
import { SidebarButton } from './sidebar-button'
import { sidebarSections } from './sidebar-routes'

export function Sidebar({ session }: { session: z.infer<typeof userJWT> }) {
  const { isOpen, close } = useSidebarStore()
  const isDesktop = useMediaQuery('(min-width: 1024px)')

  return (
    <>
      <aside
        data-state={isOpen ? 'open' : 'closed'}
        className={cn(
          `w-[286px] h-[calc(100dvh-(2*0.625rem))] left-2.5 top-2.5 z-99
                    fixed rounded-md border border-border bg-background flex flex-col justify-between select-none transition-transform`,
          `lg:translate-x-0`, // Always visible on desktop
          `-translate-x-[calc(100%+0.625rem)] data-[state=open]:translate-x-0`, // Slide in on mobile
        )}
      >
        <div className="flex w-full justify-between items-center px-5">
          <TextLogo className="size-16 text-primary" />
          <Button variant={'ghost'} size={'icon'} onClick={close}>
            <PanelLeft className="text-muted-foreground" />
          </Button>
        </div>
        <div className="space-y-4">
          <div className="flex w-full justify-between items-center px-5">
            <div className="flex gap-3">
              <Avatar
                className="size-9 rounded-sm"
                fallbackHash={session.company?.id as string}
                fallbackType="marble"
                variant="square"
              />
              <div>
                <p className="text-sm font-medium tracking-tight">
                  {session.company?.name}
                </p>
                <p className="text-xs tracking-tight text-muted-foreground">
                  Minha empresa
                </p>
              </div>
            </div>
          </div>
          <div className="w-full px-5">
            <Button
              variant={'outline'}
              className="h-8.5 bg-muted/50 hover:bg-muted text-muted-foreground px-3 text-[0.8rem] w-full justify-between"
            >
              <div className="inline-flex items-center gap-1.5">
                <Search className={'size-4'} />
                Acesso rápido
              </div>
              <div className="inline-flex items-center gap-1.5">
                <Badge
                  className="rounded-[4px] px-0.5 min-w-5 bg-background text-muted-foreground grid place-items-center"
                  variant={'outline'}
                >
                  ⌘
                </Badge>
                <Badge
                  className="rounded-[4px] px-0.5 min-w-5 bg-background text-muted-foreground grid place-items-center"
                  variant={'outline'}
                >
                  K
                </Badge>
              </div>
            </Button>
          </div>
        </div>
        <div
          className="w-full h-full py-5 overflow-y-auto space-y-5 px-2"
          style={{
            maskImage: `
                        linear-gradient(to bottom, transparent, white 1rem),
                        linear-gradient(to top, transparent, white 1rem)
                    `,
            maskComposite: 'intersect',
            WebkitMaskComposite: 'destination-in',
          }}
        >
          {sidebarSections.map((section, i) => (
            <div key={i} className="space-y-1">
              <p className="text-xs px-5 uppercase tracking-tight text-muted-foreground font-semibold">
                {section.title}
              </p>
              <div className="px-3">
                {section.items.map((item) => (
                  <SidebarButton key={item.id} data={item} />
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="h-16 shrink-0 w-full bg-card border-t border-border rounded-b-md px-4 flex items-center justify-between gap-5">
          <div className="flex items-center min-w-0 flex-1">
            <AccountPopover
              session={session}
              showData
              className="min-w-0 flex-1 overflow-hidden"
              variant="square"
            />
          </div>
          <ModeToggle />
        </div>
      </aside>
      <div
        className={cn(
          'fixed w-full h-dvh z-98 bg-background/5 backdrop-blur-xs transition-all',
          isDesktop && 'hidden',
          !isDesktop && !isOpen
            ? 'opacity-0 pointer-events-none'
            : 'opacity-100 pointer-events-auto',
        )}
        onClick={close}
      ></div>
    </>
  )
}
