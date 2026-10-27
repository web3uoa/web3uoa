const features = [
  {
    title: "Learn & Build",
    description:
      "Hands-on workshops covering blockchain fundamentals, smart contract development, and integration with AI.",
    hover: "hover:border-primary/60",
  },
  {
    title: "Community",
    description:
      "Connect with a diverse network of students, alumni, and industry professionals passionate about Web3.",
    hover: "hover:border-violet/70",
  },
  {
    title: "Opportunities",
    description:
      "Gain exclusive access to internships, hackathons, and career pathways in the evolving blockchain ecosystem.",
    hover: "hover:border-primary/60",
  },
];

export function About() {
  return (
    <section
      id="about"
      className="relative mx-auto max-w-[1200px] scroll-mt-20 px-7 pb-[130px]"
    >
      <h2
        data-pt="1"
        className="m-0 max-w-[14ch] text-[length:clamp(36px,5.5vw,68px)] font-bold leading-none tracking-[-0.035em]"
      >
        Building the Decentralised Future
      </h2>
      <p
        data-rv="1"
        className="mt-6 max-w-[56ch] text-pretty text-[19px] leading-[1.55] text-subtle"
      >
        Auckland&apos;s premier student-led organisation dedicated to blockchain
        education and innovation. We bridge the gap between university theory
        and industry-grade Web3 development.
      </p>
      <div className="mt-14 grid grid-cols-1 gap-4 md:grid-cols-3">
        {features.map((f) => (
          <div
            key={f.title}
            data-rv="1"
            className={`rounded-[20px] border border-border bg-card p-[30px] transition-colors ${f.hover}`}
          >
            <h3 className="mb-2.5 text-2xl tracking-[-0.02em]">{f.title}</h3>
            <p className="leading-[1.55] text-muted-foreground">
              {f.description}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
