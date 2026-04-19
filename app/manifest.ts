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
        src: "/pwa.png",
        sizes: "427x417",
        type: "image/png",
        purpose: "any",
      },
    ],
  };
}
