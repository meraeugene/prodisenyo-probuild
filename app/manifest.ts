import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Prodisenyo ProBuild",
    short_name: "ProBuild",
    description:
      "Payroll, budget tracking, estimate reviews, and overtime approvals in one workspace.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#f4fbf6",
    theme_color: "#14532d",
    orientation: "portrait",
    lang: "en-PH",
    icons: [
      {
        src: "/icon?size=192",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icon?size=512",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
