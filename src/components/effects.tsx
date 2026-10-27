"use client";

import { useEffect, useRef } from "react";

type Particle = {
  tx: number;
  ty: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  ox: number;
  oy: number;
  k: number;
  t0: number;
  u: number;
  c: string;
  cl: string;
  b: number;
};

type Field = {
  cv: HTMLCanvasElement;
  el: HTMLElement;
  hero?: boolean;
  ps: Particle[];
  W?: number;
  H?: number;
  dpr?: number;
  gap?: number;
  t0?: number;
  nextBurst?: number;
  release?: number;
};

type Fx = HTMLElement & {
  _rv?: boolean;
  _rt?: number;
  _done?: boolean;
  _h?: number;
  _tx?: number;
  _ty?: number;
  _on?: boolean;
};

const ease = "cubic-bezier(.2,.7,.2,1)";

const isLight = () => document.documentElement.dataset.theme === "light";

// Teal -> violet gradient position u (0..1) as an "r,g,b" string; darker in light mode.
const grad = (u: number, light: boolean) =>
  (light
    ? [13 + 96 * u, 148 - 108 * u, 136 + 81 * u]
    : [110 + 57 * u, 231 - 92 * u, 200 + 50 * u]
  )
    .map(Math.round)
    .join(",");

/**
 * Page-wide visual effects driven by data attributes in the markup:
 * [data-hero-canvas] particle logo, h2[data-pt] particle titles, [data-rv]
 * scroll reveals, [data-wipe] clip reveals, [data-tilt] hover tilt,
 * img[data-px] parallax and [data-prog] scroll progress.
 */
export function Effects() {
  const bgRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const bgc = bgRef.current;
    if (!bgc) return;

    const q = <T extends HTMLElement = HTMLElement>(s: string) =>
      Array.from(document.querySelectorAll<T>(s));
    const fam = () => getComputedStyle(document.body).fontFamily;
    const loadFonts = () =>
      document.fonts?.load
        ? Promise.all([
            document.fonts.load(`800 100px ${fam()}`),
            document.fonts.load(`700 60px ${fam()}`),
          ])
        : Promise.resolve();

    // Widths of the wordmark pieces; the O is replaced by a cube 1.3x cap height.
    const wordLayout = (ctx: CanvasRenderingContext2D, fs: number) => {
      ctx.font = `800 ${fs}px ${fam()}`;
      ctx.textBaseline = "middle";
      ctx.letterSpacing = `${-fs * 0.03}px`;
      const mo = ctx.measureText("O"),
        r =
          ((mo.actualBoundingBoxAscent + mo.actualBoundingBoxDescent) / 2) *
          1.3,
        cubeW = r * 1.732 + fs * 0.04,
        pre = ctx.measureText("WEB3U").width,
        aW = ctx.measureText("A").width;
      return { mo, r, cubeW, pre, total: pre + cubeW + aW };
    };

    // Largest font size at which the wordmark fits the canvas.
    const heroFontSize = (
      ctx: CanvasRenderingContext2D,
      W: number,
      H: number,
    ) => Math.min(H * 0.8, ((W * 0.98) / wordLayout(ctx, 100).total) * 100);

    // Paints WEB3UOA with the O swapped for an isometric cube (a block).
    // `shade` sets the fill for each cube face: 1 = top, 0.72 = left, 0.45 = right.
    const drawWordmark = (
      ctx: CanvasRenderingContext2D,
      W: number,
      H: number,
      fs: number,
      shade: (level: number) => void,
    ) => {
      const { mo, r, cubeW, pre, total } = wordLayout(ctx, fs);
      ctx.textAlign = "left";
      const y = H / 2 + fs * 0.04,
        x0 = (W - total) / 2,
        cx = x0 + pre + cubeW / 2,
        cy = y + (mo.actualBoundingBoxDescent - mo.actualBoundingBoxAscent) / 2,
        w = r * 0.866;
      shade(1);
      ctx.fillText("WEB3U", x0, y);
      ctx.fillText("A", x0 + pre + cubeW, y);
      const v = {
          t: [cx, cy - r],
          ur: [cx + w, cy - r / 2],
          lr: [cx + w, cy + r / 2],
          b: [cx, cy + r],
          ll: [cx - w, cy + r / 2],
          ul: [cx - w, cy - r / 2],
          c: [cx, cy],
        },
        faces: [number, number[][]][] = [
          [1, [v.t, v.ur, v.c, v.ul]],
          [0.72, [v.ul, v.c, v.b, v.ll]],
          [0.45, [v.c, v.ur, v.lr, v.b]],
        ];
      faces.forEach(([level, pts]) => {
        const mx = pts.reduce((a, p) => a + p[0], 0) / 4,
          my = pts.reduce((a, p) => a + p[1], 0) / 4;
        shade(level);
        ctx.beginPath();
        pts.forEach((p, i) => {
          const px = mx + (p[0] - mx) * 0.82,
            py = my + (p[1] - my) * 0.82;
          if (i) ctx.lineTo(px, py);
          else ctx.moveTo(px, py);
        });
        ctx.closePath();
        ctx.fill();
      });
    };

    // Reduced motion: no animation, just paint the hero wordmark statically.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      const hero = q<HTMLCanvasElement>("[data-hero-canvas]")[0];
      if (!hero) return;
      const paint = () => {
        const W = hero.clientWidth,
          H = hero.clientHeight;
        if (!W || !H) return;
        const dpr = Math.min(devicePixelRatio || 1, 2);
        hero.width = W * dpr;
        hero.height = H * dpr;
        const ctx = hero.getContext("2d")!;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        const fs = heroFontSize(ctx, W, H);
        const g = ctx.createLinearGradient(0, 0, W, 0);
        g.addColorStop(0, `rgb(${grad(0, isLight())})`);
        g.addColorStop(1, `rgb(${grad(1, isLight())})`);
        ctx.fillStyle = g;
        drawWordmark(ctx, W, H, fs, (l) => (ctx.globalAlpha = l));
        ctx.globalAlpha = 1;
      };
      loadFonts().then(paint, paint);
      window.addEventListener("resize", paint);
      const mo = new MutationObserver(paint);
      mo.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ["data-theme"],
      });
      return () => {
        window.removeEventListener("resize", paint);
        mo.disconnect();
      };
    }

    let alive = true;
    let raf = 0;
    let started = false;
    let rt: ReturnType<typeof setTimeout>;
    let sv = 0;
    let lastY = window.scrollY;
    const mouse = { x: -9999, y: -9999 };
    const fields: Field[] = [];
    const cleanups: (() => void)[] = [];
    let bw = 0,
      bh = 0,
      bd = 1;

    const nodes = Array.from({ length: 70 }, () => ({
      x: Math.random(),
      y: Math.random(),
      z: 0.3 + Math.random() * 0.7,
      vx: (Math.random() - 0.5) * 0.00006,
      vy: (Math.random() - 0.5) * 0.00004,
    }));

    // ---- scroll reveal ----
    const revealEls = q<Fx>("[data-rv]");
    const wipes = revealEls.filter((el) => el.dataset.wipe);
    revealEls.forEach((el) => {
      el.style.opacity = "0";
      el.style.transform = "translateY(40px)";
      if (el.dataset.wipe) el.style.clipPath = "inset(100% 0 0 0 round 18px)";
    });
    const reveal = (el: Fx) => {
      if (el._rv) return;
      el._rv = true;
      const sibs = Array.from(el.parentElement!.children).filter((c) =>
        c.hasAttribute("data-rv"),
      );
      const d = Math.max(0, sibs.indexOf(el)) * 110;
      el.style.transition = `opacity .9s ${ease} ${d}ms, transform .9s ${ease} ${d}ms, clip-path 1.1s ${ease} ${d}ms`;
      el.style.opacity = "1";
      el.style.transform = "none";
      if (el.dataset.wipe) el.style.clipPath = "inset(0% 0 0 0 round 18px)";
      el._rt = performance.now() / 1000 + d / 1000;
      setTimeout(() => {
        el.style.transition = "";
        if (el.dataset.wipe) el.style.clipPath = "none";
        el._done = true;
      }, 1400 + d);
    };
    const io = new IntersectionObserver(
      (es) =>
        es.forEach((en) => {
          if (!en.isIntersecting) return;
          io.unobserve(en.target);
          reveal(en.target as Fx);
        }),
      { threshold: 0.12 },
    );
    revealEls.filter((el) => !el.dataset.wipe).forEach((el) => io.observe(el));
    cleanups.push(() => {
      io.disconnect();
      revealEls.forEach((el) => {
        el.style.cssText = el.style.cssText
          .replace(/(opacity|transform|transition|clip-path):[^;]*;?/g, "")
          .trim();
        el._rv = el._done = false;
      });
    });

    // ---- particle text ----
    const build = (f: Field) => {
      const cv = f.cv,
        W = cv.clientWidth,
        H = cv.clientHeight;
      if (!W || !H) return;
      const dpr = Math.min(devicePixelRatio || 1, 2);
      cv.width = W * dpr;
      cv.height = H * dpr;
      f.W = W;
      f.H = H;
      f.dpr = dpr;
      const off = document.createElement("canvas");
      off.width = W;
      off.height = H;
      const o = off.getContext("2d", { willReadFrequently: true })!;
      o.textBaseline = "middle";
      o.fillStyle = "#fff";
      if (f.hero) {
        const fs = heroFontSize(o, W, H);
        drawWordmark(o, W, H, fs, (l) => {
          const c = Math.round(l * 255);
          o.fillStyle = `rgb(${c},${c},${c})`;
        });
        f.gap = Math.max(4, Math.round(W / 190));
      } else {
        const cs = getComputedStyle(f.el),
          fs = parseFloat(cs.fontSize),
          lh = parseFloat(cs.lineHeight) || fs,
          ls = parseFloat(cs.letterSpacing) || 0,
          pad = 12;
        o.font = `${cs.fontWeight} ${fs}px ${fam()}`;
        o.letterSpacing = `${ls}px`;
        o.textAlign = "left";
        const avail = f.el.clientWidth,
          lines: string[] = [];
        let cur = "";
        (f.el.textContent ?? "")
          .trim()
          .split(/\s+/)
          .forEach((w) => {
            const t = cur ? `${cur} ${w}` : w;
            if (cur && o.measureText(t).width > avail) {
              lines.push(cur);
              cur = w;
            } else cur = t;
          });
        lines.push(cur);
        lines.forEach((l, i) =>
          o.fillText(l, pad, pad + i * lh + lh / 2 + fs * 0.04),
        );
        f.gap = Math.max(3, Math.round(fs / 20));
      }
      const data = o.getImageData(0, 0, W, H).data,
        gap = f.gap!,
        old = f.ps,
        ps: Particle[] = [];
      let minX = 1e9,
        maxX = -1e9;
      for (let y = gap / 2; y < H; y += gap)
        for (let x = gap / 2; x < W; x += gap) {
          if (data[((y | 0) * W + (x | 0)) * 4 + 3] > 128) {
            const p = old[ps.length];
            minX = Math.min(minX, x);
            maxX = Math.max(maxX, x);
            ps.push({
              tx: x,
              ty: y,
              x: p ? p.x : Math.random() * W,
              y: p ? p.y : Math.random() * H,
              vx: 0,
              vy: 0,
              ox: 0,
              oy: 0,
              k: 0.4 + Math.random(),
              t0: f.t0 === undefined ? 1e9 : 0,
              u: 0,
              c: "",
              cl: "",
              b: data[((y | 0) * W + (x | 0)) * 4] / 255,
            });
          }
        }
      ps.forEach((p) => {
        const u = (p.tx - minX) / Math.max(1, maxX - minX);
        p.u = u;
        p.c = grad(u, false);
        p.cl = grad(u, true);
      });
      f.ps = ps;
    };

    const sizeBg = () => {
      bd = Math.min(devicePixelRatio || 1, 2);
      bw = innerWidth;
      bh = innerHeight;
      bgc.width = bw * bd;
      bgc.height = bh * bd;
    };

    const step = (f: Field, now: number) => {
      const cv = f.cv,
        ps = f.ps;
      if (!ps.length || !f.W) return;
      const r = cv.getBoundingClientRect(),
        vh = innerHeight;
      if (r.bottom < -80 || r.top > vh + 80) return;
      if (f.t0 === undefined) {
        if (!f.hero && r.top > vh * 0.9) return;
        f.t0 = now + (f.hero ? 0.1 : 0);
        f.nextBurst = f.t0 + 4;
        for (const p of ps) {
          p.t0 = f.t0 + Math.random() * 0.3;
          p.x = p.tx + (Math.random() - 0.5) * 320;
          p.y = p.ty + 120 + Math.random() * 260;
        }
      }
      const ctx = cv.getContext("2d")!,
        W = f.W,
        H = f.H!,
        gap = f.gap!,
        dpr = f.dpr!;
      if (f.hero) {
        if (now > f.nextBurst!) {
          f.nextBurst = now + 4.5;
          f.release = now + 0.8;
          for (const p of ps) {
            const a = Math.random() * 6.283,
              d = 80 + Math.random() * 220;
            p.ox = Math.cos(a) * d;
            p.oy = Math.sin(a) * d * 0.6;
          }
        }
        if (f.release && now > f.release) {
          f.release = 0;
          for (const p of ps) {
            p.ox = 0;
            p.oy = 0;
          }
        }
      }
      let sweep = -9999;
      if (f.hero) sweep = (((now - f.t0) % 2.25) / 2.25) * (W + 300) - 150;
      else {
        const el = now - f.t0 - 0.7;
        if (el > 0 && el < 1.8) sweep = (el / 1.8) * (W + 300) - 150;
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);
      const mx = mouse.x - r.left,
        my = mouse.y - r.top,
        svc = Math.max(-60, Math.min(60, sv)),
        act: Particle[] = [];
      for (const p of ps) {
        if (now < p.t0) continue;
        p.vx += (p.tx + p.ox - p.x) * 0.07;
        p.vy += (p.ty + p.oy - p.y) * 0.07 - svc * p.k * 0.09;
        const dx = p.x - mx,
          dy = p.y - my,
          d2 = dx * dx + dy * dy;
        if (d2 < 11000) {
          const d = Math.sqrt(d2) || 1,
            ff = (1 - d / 105) * 3.2;
          p.vx += (dx / d) * ff;
          p.vy += (dy / d) * ff;
        }
        p.vx *= 0.84;
        p.vy *= 0.84;
        p.x += p.vx;
        p.y += p.vy;
        act.push(p);
      }
      const cell = gap * 1.7,
        cols = Math.ceil(W / cell) + 2,
        grid = new Map<number, number[]>();
      act.forEach((p, i) => {
        const k =
          Math.max(0, (p.y / cell) | 0) * cols + Math.max(0, (p.x / cell) | 0);
        const l = grid.get(k);
        if (l) l.push(i);
        else grid.set(k, [i]);
      });
      ctx.lineWidth = 0.6;
      const light = isLight();
      ctx.strokeStyle = light
        ? "rgba(30,70,110,0.22)"
        : "rgba(140,200,230,0.2)";
      ctx.beginPath();
      const lim = cell * cell;
      act.forEach((p, i) => {
        const cx = Math.max(0, (p.x / cell) | 0),
          cy = Math.max(0, (p.y / cell) | 0);
        for (let yy = cy; yy <= cy + 1; yy++)
          for (let xx = cx - 1; xx <= cx + 1; xx++) {
            if (yy === cy && xx < cx) continue;
            const l = grid.get(yy * cols + xx);
            if (!l) continue;
            for (const j of l) {
              if (j <= i && yy === cy && xx === cx) continue;
              const qp = act[j],
                dx = qp.x - p.x,
                dy = qp.y - p.y;
              if (dx * dx + dy * dy < lim) {
                ctx.moveTo(p.x, p.y);
                ctx.lineTo(qp.x, qp.y);
              }
            }
          }
      });
      ctx.stroke();
      const rad = Math.max(1.3, gap * 0.3);
      for (const p of act) {
        const s = Math.exp(-Math.pow((p.x - sweep) / 70, 2)),
          a = Math.min(1, (now - p.t0) / 0.5);
        ctx.fillStyle =
          s > 0.05
            ? `rgba(${light ? "12,18,32" : "255,255,255"},${Math.min(1, 0.55 + s * 0.45) * a})`
            : `rgba(${light ? p.cl : p.c},${0.95 * a * (0.25 + 0.75 * p.b)})`;
        const rr = rad * (1 + s * 0.8);
        ctx.fillRect(p.x - rr, p.y - rr, rr * 2, rr * 2);
      }
    };

    const drawBg = (y: number) => {
      const ctx = bgc.getContext("2d")!,
        W = bw,
        H = bh;
      const light = isLight();
      ctx.setTransform(bd, 0, 0, bd, 0, 0);
      ctx.clearRect(0, 0, W, H);
      const pts = nodes.map((n) => {
        n.x = (n.x + n.vx + 1) % 1;
        n.y = (n.y + n.vy + 1) % 1;
        return {
          x: n.x * W,
          y: (((n.y * H - y * 0.28 * n.z) % H) + H) % H,
          z: n.z,
        };
      });
      ctx.lineWidth = 0.7;
      for (let i = 0; i < pts.length; i++)
        for (let j = i + 1; j < pts.length; j++) {
          const dx = pts[i].x - pts[j].x,
            dy = pts[i].y - pts[j].y,
            d = dx * dx + dy * dy;
          if (d < 22500) {
            ctx.strokeStyle = `rgba(${light ? "30,70,110" : "140,200,230"},${(1 - d / 22500) * (light ? 0.2 : 0.16)})`;
            ctx.beginPath();
            ctx.moveTo(pts[i].x, pts[i].y);
            ctx.lineTo(pts[j].x, pts[j].y);
            ctx.stroke();
          }
        }
      for (const p of pts) {
        const u = p.x / W;
        ctx.fillStyle = `rgba(${grad(u, light)},${0.55 * p.z})`;
        ctx.fillRect(p.x - 1.5 * p.z, p.y - 1.5 * p.z, 3 * p.z, 3 * p.z);
      }
    };

    // ---- per-frame loop ----
    let prog: HTMLElement | undefined;
    let pxs: HTMLImageElement[] = [];
    let tilts: Fx[] = [];

    const loop = () => {
      if (!alive) return;
      raf = requestAnimationFrame(loop);
      const now = performance.now() / 1000,
        y = window.scrollY;
      sv = sv * 0.85 + (y - lastY) * 0.15;
      lastY = y;
      const max = document.documentElement.scrollHeight - innerHeight;
      if (prog)
        prog.style.transform = `scaleX(${max > 0 ? Math.min(1, y / max) : 0})`;
      drawBg(y);
      fields.forEach((f) => step(f, now));
      const vh = innerHeight;
      for (const el of wipes)
        if (!el._rv) {
          const r = el.getBoundingClientRect();
          if (r.top < vh * 0.88 && r.bottom > 0) reveal(el);
        }
      for (const el of tilts) {
        const r = el.getBoundingClientRect();
        if (r.bottom < 0 || r.top > vh) continue;
        const px = el._on ? (mouse.x - r.left) / r.width : 0.5,
          py = el._on ? (mouse.y - r.top) / r.height : 0.5;
        el._h! += ((el._on ? 1 : 0) - el._h!) * 0.1;
        el._tx! += (px - el._tx!) * 0.14;
        el._ty! += (py - el._ty!) * 0.14;
        if (el._done)
          el.style.transform = `perspective(900px) rotateX(${((0.5 - el._ty!) * 12 * el._h!).toFixed(2)}deg) rotateY(${((el._tx! - 0.5) * 14 * el._h!).toFixed(2)}deg) translateZ(${(el._h! * 14).toFixed(1)}px)`;
        const g = el.querySelector<HTMLElement>("[data-glare]");
        if (g) {
          g.style.opacity = el._h!.toFixed(2);
          g.style.background = `radial-gradient(circle at ${(el._tx! * 100).toFixed(0)}% ${(el._ty! * 100).toFixed(0)}%, rgba(255,255,255,.9), transparent 55%)`;
        }
      }
      for (const im of pxs) {
        const card = im.parentElement as Fx,
          r = card.getBoundingClientRect();
        if (r.bottom < 0 || r.top > vh) continue;
        const pr = (r.top + r.height / 2 - vh / 2) / vh,
          qq =
            card._rt === undefined
              ? 0
              : Math.min(1, Math.max(0, now - card._rt) / 1.6),
          ez = 1 - Math.pow(1 - qq, 3),
          sc = 1.16 + (1 - ez) * 0.4 + (card._h || 0) * 0.08,
          hx = card._on ? -(card._tx! - 0.5) * 18 * card._h! : 0;
        im.style.transform = `translate(${hx.toFixed(1)}px,${(-pr * 34).toFixed(1)}px) scale(${sc.toFixed(3)})`;
        im.style.filter = `saturate(${(0.6 + 0.4 * ez + 0.25 * (card._h || 0)).toFixed(2)}) brightness(${(0.7 + 0.3 * ez).toFixed(2)})`;
      }
    };

    const setup = () => {
      const hero = q<HTMLCanvasElement>("[data-hero-canvas]")[0];
      if (hero)
        fields.push({ cv: hero, el: hero.parentElement!, hero: true, ps: [] });
      q("h2[data-pt]").forEach((h) => {
        const c = document.createElement("canvas");
        c.setAttribute("aria-hidden", "true");
        c.dataset.ptCanvas = "1";
        c.style.cssText =
          "position:absolute;left:-12px;top:-12px;width:calc(100% + 24px);height:calc(100% + 24px);pointer-events:none";
        h.style.position = "relative";
        h.style.color = "transparent";
        h.appendChild(c);
        fields.push({ cv: c, el: h, ps: [] });
      });
      cleanups.push(() =>
        q("h2[data-pt]").forEach((h) => {
          h.querySelector("[data-pt-canvas]")?.remove();
          h.style.color = "";
          h.style.position = "";
        }),
      );
      fields.forEach(build);
      prog = q("[data-prog]")[0];
      pxs = q<HTMLImageElement>("img[data-px]");
      tilts = q<Fx>("[data-tilt]");
      tilts.forEach((el) => {
        el._h = 0;
        el._tx = 0;
        el._ty = 0;
        const on = () => (el._on = true);
        const off = () => (el._on = false);
        el.addEventListener("pointerenter", on);
        el.addEventListener("pointerleave", off);
        cleanups.push(() => {
          el.removeEventListener("pointerenter", on);
          el.removeEventListener("pointerleave", off);
          el.style.transform = "";
        });
      });
      cleanups.push(() =>
        pxs.forEach((im) => {
          im.style.transform = "";
          im.style.filter = "";
        }),
      );
      sizeBg();
    };

    const go = () => {
      if (started || !alive) return;
      started = true;
      setup();
      loop();
    };
    loadFonts().then(go, go);
    const fallback = setTimeout(go, 1800);

    const onMove = (e: PointerEvent) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    };
    const onResize = () => {
      clearTimeout(rt);
      rt = setTimeout(() => {
        fields.forEach(build);
        sizeBg();
      }, 150);
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("resize", onResize);

    return () => {
      alive = false;
      cancelAnimationFrame(raf);
      clearTimeout(fallback);
      clearTimeout(rt);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("resize", onResize);
      cleanups.forEach((fn) => fn());
    };
  }, []);

  return (
    <canvas
      ref={bgRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0 h-full w-full"
    />
  );
}
