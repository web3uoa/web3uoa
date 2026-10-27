const socials = [
  { label: "instagram", href: "https://instagram.com/web3uoa" },
  { label: "x", href: "https://x.com/web3uoa" },
  {
    label: "linkedin",
    href: "https://www.linkedin.com/company/web3uoa-university-of-auckland-web3-club/",
  },
];

export function Hero() {
  return (
    <header
      id="top"
      className="relative mx-auto flex min-h-[max(560px,calc(100svh-60px))] max-w-[1600px] flex-col px-5 pb-10 pt-6 sm:px-7"
    >
      <h1 className="relative m-0 min-h-[260px] flex-1">
        <span className="sr-only">WEB3UOA</span>
        <canvas
          data-hero-canvas="1"
          aria-hidden="true"
          className="absolute inset-0 block h-full w-full"
        />
      </h1>
      <div
        data-rv="1"
        className="mt-7 flex flex-wrap items-end justify-between gap-8"
      >
        <p className="m-0 max-w-[26ch] text-pretty text-[length:clamp(20px,2.4vw,28px)] leading-[1.35] text-subtle">
          Educating the next generation of blockchain innovators.
        </p>
        <div>
          <div className="flex flex-wrap gap-3.5">
            <a
              href="https://forms.gle/vzRb7t46SPBUwi7v8"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-xl bg-foreground px-7 py-[15px] text-base font-semibold text-background transition-colors hover:bg-primary"
            >
              Join the Club →
            </a>
            <a
              href="#about"
              className="rounded-xl border border-input px-7 py-[15px] text-base font-medium text-foreground transition-colors hover:border-primary"
            >
              Learn More
            </a>
          </div>
          <div className="mt-[22px] flex gap-[22px] font-mono text-[13px]">
            {socials.map((s) => (
              <a
                key={s.label}
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-faint transition-colors hover:text-foreground"
              >
                {s.label}
              </a>
            ))}
          </div>
        </div>
      </div>
    </header>
  );
}
