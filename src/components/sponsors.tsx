import Image from "next/image";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const sponsorTiers = [
  {
    tier: "Gold Sponsors",
    sponsors: [
      {
        name: "FireEyes",
        logo: "/logo/fe_black_logo.svg",
        logoWidth: 220,
        logoHeight: 90,
      },
    ],
  },
  {
    tier: "Silver Sponsors",
    sponsors: [
      {
        name: "Avalanche",
        logo: "/logo/avalanche_logo.svg",
        logoWidth: 220,
        logoHeight: 90,
      },
      {
        name: "NewMoney",
        logo: "/logo/newmoney_logo.webp",
        logoWidth: 461,
        logoHeight: 126,
      },
    ],
  },
  {
    tier: "Supported by",
    sponsors: [
      {
        name: "Ethereum Foundation",
        logo: "/logo/ethereum_foundation_dev_accel_logo.png",
        logoWidth: 300,
        logoHeight: 110,
      },
    ],
  },
] as const;

export function Sponsors() {
  return (
    <section
      id="partners"
      className="py-24 md:py-32 bg-background border-t border-border/50"
    >
      <div className="container mx-auto px-4">
        {/* Section header */}
        <div className="mb-16 space-y-4 max-w-2xl mx-auto text-center">
          <span className="text-sm font-bold uppercase tracking-[0.2em] text-primary">
            03 / Partners
          </span>
          <h2 className="text-4xl md:text-5xl font-black tracking-tight text-foreground">
            Our Sponsors
          </h2>
          <p className="text-lg text-muted-foreground leading-relaxed">
            Collaborating with industry leaders to drive the future of Web3 in
            New Zealand.
          </p>
        </div>

        <div className="space-y-16 max-w-5xl mx-auto pt-8">
          {sponsorTiers.map((tier) => (
            <div key={tier.tier} className="flex flex-col items-center">
              <div className="flex flex-col items-center mb-10 w-full">
                <h3
                  className={cn(
                    "text-xs md:text-sm font-bold uppercase tracking-[0.18em] text-center px-4 py-1.5 rounded-full border mb-4",
                    tier.tier === "Gold Sponsors"
                      ? "bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400"
                      : tier.tier === "Silver Sponsors"
                        ? "bg-slate-500/10 border-slate-500/20 text-slate-600 dark:text-slate-400"
                        : "bg-primary/5 border-primary/10 text-primary/80",
                  )}
                >
                  {tier.tier}
                </h3>
                <div className="h-px w-24 bg-gradient-to-r from-transparent via-border/60 to-transparent" />
              </div>
              <div className="flex flex-wrap justify-center items-center gap-12 md:gap-20 w-full">
                {tier.sponsors.map((sponsor) => (
                  <div
                    key={sponsor.name}
                    className="group relative flex h-20 w-[260px] items-center justify-center transition-all duration-300 hover:-translate-y-1 hover:scale-105 md:h-24"
                  >
                    {/* Floating effect background */}
                    <div
                      className={cn(
                        "absolute inset-0 rounded-full opacity-0 blur-3xl transition-opacity duration-500 group-hover:opacity-20",
                        tier.tier === "Gold Sponsors"
                          ? "bg-yellow-400"
                          : tier.tier === "Silver Sponsors"
                            ? "bg-slate-400"
                            : "bg-primary",
                      )}
                    />
                    <Image
                      src={sponsor.logo}
                      alt={`${sponsor.name} logo`}
                      width={sponsor.logoWidth}
                      height={sponsor.logoHeight}
                      unoptimized
                      className={cn(
                        "relative z-10 h-auto max-h-full w-auto max-w-full object-contain",
                        sponsor.name === "Avalanche" && "scale-90",
                        sponsor.name === "Ethereum Foundation" && "scale-125",
                        sponsor.name === "FireEyes" &&
                          "scale-110 drop-shadow-[0_0_14px_rgba(245,158,11,0.45)]",
                      )}
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}

          <div className="flex justify-center pt-4">
            <Button size="lg" className="rounded-xl font-bold" asChild>
              <a href="mailto:team@web3uoa.nz">Become a Partner</a>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
