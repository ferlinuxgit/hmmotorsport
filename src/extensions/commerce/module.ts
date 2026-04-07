import type { AppModule } from "@/lib/modules/contracts";

export const moduleDefinition: AppModule = {
  key: "commerce",
  name: "Commerce Engine",
  area: "commerce",
  description: "Catálogo, precios, pedidos y checkout desacoplado para tiendas online o venta de productos digitales.",
  navigation: [
    {
      title: "Catálogo",
      href: "/#modules",
      description: "Bloques y flujos para catálogo y ventas",
      segment: "site"
    },
    {
      title: "Pedidos",
      href: "/dashboard",
      description: "Seguimiento de órdenes y pagos",
      segment: "app"
    }
  ],
  marketingSections: [
    {
      key: "commerce-checkout",
      eyebrow: "Checkout abstraction",
      title: "Conecta Stripe y PayPal desde una sola API interna",
      description: "El backend unifica la creación de checkout sessions y permite extender otros gateways."
    }
  ],
  dashboardCards: [
    {
      key: "commerce-orders",
      title: "Operación comercial",
      description: "Consulta productos, precios y pedidos desde la misma base de datos.",
      href: "/dashboard"
    }
  ],
  dbTables: ["products", "prices", "orders"],
  paymentProviders: ["stripe", "paypal"]
};

