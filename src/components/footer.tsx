const navigate = [
  { label: "About", href: "#about" },
  { label: "Events", href: "#events" },
  { label: "Partners", href: "#partners" },
  { label: "Join the Club", href: "https://forms.gle/vzRb7t46SPBUwi7v8" },
];

const connect = [
  { label: "Instagram", href: "https://instagram.com/web3uoa" },
  { label: "X", href: "https://x.com/web3uoa" },
  {
    label: "LinkedIn",
    href: "https://www.linkedin.com/company/web3uoa-university-of-auckland-web3-club/",
  },
  { label: "team@web3uoa.nz", href: "mailto:team@web3uoa.nz" },
];

const linkClass = "w-fit text-[15px] text-subtle transition-colors hover:text-foreground";
const headingClass = "mb-1 font-mono text-xs uppercase text-faint";

export function Footer() {
  return (
    <footer className="relative border-t border-border bg-footer">
      <div className="mx-auto grid max-w-[1200px] grid-cols-1 gap-10 px-7 pb-9 pt-14 sm:grid-cols-2 lg:grid-cols-4">
        <div className="min-w-0 sm:col-span-2">
          <div className="flex items-center gap-2.5 font-bold">
            <img
              src="/logo/web3uoa_logo.png"
              alt="WEB3UOA"
              className="h-7 w-7 object-contain"
            />
            WEB3UOA
          </div>
          <p className="mt-4 max-w-[38ch] leading-[1.55] text-muted-foreground">
            Empowering the next generation of builders, shapers, and innovators
            at the University of Auckland.
          </p>
        </div>
        <div className="flex flex-col gap-2.5">
          <div className={headingClass}>Navigate</div>
          {navigate.map((l) => (
            <a
              key={l.label}
              href={l.href}
              {...(l.href.startsWith("http")
                ? { target: "_blank", rel: "noopener noreferrer" }
                : {})}
              className={linkClass}
            >
              {l.label}
            </a>
          ))}
        </div>
        <div className="flex flex-col gap-2.5">
          <div className={headingClass}>Connect</div>
          {connect.map((l) => (
            <a
              key={l.label}
              href={l.href}
              {...(l.href.startsWith("http")
                ? { target: "_blank", rel: "noopener noreferrer" }
                : {})}
              className={linkClass}
            >
              {l.label}
            </a>
          ))}
        </div>
      </div>
      <div className="mx-auto flex max-w-[1200px] flex-wrap justify-between gap-3 px-7 pb-8 font-mono text-xs text-faint">
        <span>&copy; {new Date().getFullYear()} WEB3UOA. All rights reserved.</span>
        <span>University of Auckland Web3 Club</span>
      </div>
    </footer>
  );
}
