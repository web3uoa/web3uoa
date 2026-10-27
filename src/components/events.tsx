const events = [
  {
    src: "/images/Launchnight2.jpg",
    alt: "Launch Night event",
    label: "Launch Night",
    wide: true,
  },
  {
    src: "/images/Launchnight3.jpg",
    alt: "Launch Night networking",
    label: "Launch Night",
  },
  {
    src: "/images/GovDojo1.jpg",
    alt: "GovDojo workshop",
    label: "GovDojo",
  },
  {
    src: "/images/Industrynight1.jpg",
    alt: "Industry Night",
    label: "Industry Night",
    wide: true,
  },
  {
    src: "/images/Launchnight1.jpg",
    alt: "Launch Night presentation",
    label: "Launch Night",
    wide: true,
  },
];

export function Events() {
  return (
    <section
      id="events"
      className="relative mx-auto max-w-[1200px] scroll-mt-20 px-7 pb-[130px]"
    >
      <h2
        data-pt="1"
        className="m-0 text-[length:clamp(36px,5.5vw,68px)] font-bold leading-none tracking-[-0.035em]"
      >
        Moments That Matter
      </h2>
      <p
        data-rv="1"
        className="mt-6 max-w-[50ch] text-pretty text-[19px] leading-[1.55] text-subtle"
      >
        From launch nights to industry meetups, see what our community has been
        up to.
      </p>
      <div className="mt-12 grid auto-rows-[260px] grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
        {events.map((e, i) => (
          <div
            key={i}
            data-rv="1"
            data-tilt="1"
            data-wipe="1"
            className={`relative overflow-hidden rounded-[18px] border border-border bg-[oklch(0.2_0.02_265)] will-change-transform ${
              e.wide ? "sm:col-span-2" : ""
            }`}
          >
            <img
              data-px="1"
              src={e.src}
              alt={e.alt}
              className="absolute inset-0 block h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent from-45% to-[oklch(0.1_0.02_265/0.92)]" />
            <div
              data-glare="1"
              className="pointer-events-none absolute inset-0 opacity-0 mix-blend-soft-light"
            />
            <div className="absolute inset-x-[18px] bottom-4 flex items-center justify-between gap-2.5">
              <span className="text-lg font-semibold text-white">
                {e.label}
              </span>
              <span className="font-mono text-xs text-primary">
                {String(i + 1).padStart(2, "0")}
              </span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
