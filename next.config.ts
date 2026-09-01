import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Cache do roteador no navegador: páginas dinâmicas já visitadas ficam "quentes" por 30s,
    // então trocar de aba e voltar é instantâneo, sem ida ao servidor. O padrão do Next 15+ é 0
    // (nada é cacheado), que era o motivo de toda navegação refazer as queries do zero.
    // IMPORTANTE: toda ação que grava dado precisa chamar router.refresh() para invalidar esse
    // cache — sem isso, a tela voltaria com o dado antigo dentro dessa janela de 30s.
    staleTimes: {
      dynamic: 30,
      static: 180,
    },
  },
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [{ type: "host", value: "nutritracker-plum.vercel.app" }],
        destination: "https://nutritracker.com.br/:path*",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
