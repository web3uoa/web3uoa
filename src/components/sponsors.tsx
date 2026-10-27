import Image from "next/image";

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
      className="relative mx-auto max-w-[1200px] scroll-mt-20 px-7 pb-[130px]"
    >
      <h2
        data-pt="1"
        className="m-0 text-[length:clamp(36px,5.5vw,68px)] font-bold leading-none tracking-[-0.035em]"
      >
        Our Sponsors
      </h2>
      <p
        data-rv="1"
        className="mt-6 max-w-[50ch] text-pretty text-[19px] leading-[1.55] text-subtle"
      >
        Collaborating with industry leaders to drive the future of Web3 in New
        Zealand.
      </p>
      <div className="mt-12 grid grid-cols-1 gap-3.5 md:grid-cols-3">
        {sponsorTiers.map((tier) => (
          <div
            key={tier.tier}
            data-rv="1"
            data-tilt="1"
            className="rounded-[20px] border border-border bg-card p-6"
          >
            <div className="mb-[18px] font-mono text-[13px] uppercase text-muted-foreground">
              {tier.tier}
            </div>
            {tier.sponsors.map((sponsor) => (
              <div
                key={sponsor.name}
                className="grid h-[130px] place-items-center rounded-[14px] bg-[#eef1f7] p-5"
              >
                <Image
                  src={sponsor.logo}
                  alt={`${sponsor.name} logo`}
                  width={sponsor.logoWidth}
                  height={sponsor.logoHeight}
                  unoptimized
                  className="h-auto max-h-[70px] w-auto max-w-[80%] object-contain"
                />
              </div>
            ))}
          </div>
        ))}
      </div>
      <div className="mt-7">
        <a
          href="mailto:team@web3uoa.nz"
          className="inline-block rounded-xl border border-input px-[26px] py-3.5 font-medium text-foreground transition-colors hover:border-primary"
        >
          Become a Partner →
        </a>
      </div>
    </section>
  );
}
