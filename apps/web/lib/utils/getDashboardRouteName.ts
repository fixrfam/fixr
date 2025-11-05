const routeNames = {
  home: "Início",
  notifications: "Notificações",
  logs: "Registros",
  account: "Perfil",
  security: "Segurança",
  "service-orders": "Ordens de Serviço",
  estimates: "Orçamentos",
  suppliers: "Fornecedores",
  parts: "Peças",
  inventory: "Estoque",
  support: "Suporte",
  customers: "Clientes",
  devices: "Aparelhos",
  employees: "Funcionários",
}

export function getDashboardRouteName(pathname: string) {
  const routes = pathname.split("/").filter(Boolean)

  return (
    routeNames[routes[routes.length - 1] as keyof typeof routeNames] ?? "Fixr"
  )
}
