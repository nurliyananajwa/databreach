export type SceneState = {
    stage: number;
    paused: boolean;
    reduced: boolean;
    complete: boolean;
};
export type SceneController = {
    toggle: () => void;
    replay: () => void;
    finish: () => void;
    dispose: () => void;
};
type Point = {
    x: number;
    y: number;
};
/** One finite story. No scroll listeners, input capture, or perpetual rendering. */
export function createIncidentScene(canvas: HTMLCanvasElement, visual: HTMLElement, onChange: (state: SceneState) => void): SceneController {
    const context = canvas.getContext("2d");
    const pref = window.matchMedia("(prefers-reduced-motion: reduce)");
    let reduced = pref.matches;
    let paused = false;
    let w = 600, h = 610, elapsed = reduced || !context ? 5.2 : 0;
    let last = 0, frame = 0, inView = true, disposed = false, published = "";
    const ctx = context!;
    // dot colours follow the theme (app/globals.css)
    const theme = getComputedStyle(canvas);
    const dotColour = theme.getPropertyValue("--accent-light").trim() || "#8b6cf0";
    const breachColour = theme.getPropertyValue("--coral").trim() || "#ff6b4d";
    function publish() {
        const state = { stage: elapsed < 1.4 ? 0 : elapsed < 2 ? 1 : elapsed < 4.1 ? 2 : 3, paused, reduced, complete: elapsed >= 5.2 };
        const key = JSON.stringify(state);
        if (key !== published) {
            published = key;
            onChange(state);
        }
    }
    const clamp = (v: number) => Math.max(0, Math.min(1, v)), ease = (v: number) => 1 - Math.pow(1 - clamp(v), 4), mix = (a: number, b: number, t: number) => a + (b - a) * t;
    const pieces = Array.from({ length: 96 }, (_, i) => {
        const x = (i % 4 - 1.5) * .14, y = (Math.floor(i / 4) % 4 - 1.5) * .14, z = (Math.floor(i / 16) - 2.5) * .1, a = i * 2.39996323;
        return { x, y, z, ex: Math.cos(a) * (.46 + (i % 5) * .06), ey: Math.sin(a) * (.45 + (i % 7) * .035), ez: Math.sin(i * 1.8) * .5, rx: ((i % 32) / 31 - .5) * .9, ry: (Math.floor(i / 32) - 1) * .21 + .09, accent: i % 11 === 0 };
    });
    function project(x: number, y: number, z: number, angle: number) {
        const c = Math.cos(angle), s = Math.sin(angle), xx = x * c + z * s, zz = -x * s + z * c, yy = y * .97 - zz * .24, depth = y * .24 + zz * .97, k = 3 / (3 + depth), size = Math.min(w * .69, h * .58, 340);
        return { x: w / 2 + xx * size * k, y: h * .46 + yy * size * k, k, z: depth };
    }
    function polygon(points: Point[], fill: string | CanvasGradient, stroke: string, width = 1) { ctx.beginPath(); points.forEach((p, i) => i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)); ctx.closePath(); ctx.fillStyle = fill; ctx.fill(); ctx.strokeStyle = stroke; ctx.lineWidth = width; ctx.stroke(); }
    function draw() {
        publish();
        if (!context)
            return;
        ctx.clearRect(0, 0, w, h);
        const escape = ease((elapsed - 1.4) / .46), gather = ease((elapsed - 2) / 2.5), fade = 1 - ease((elapsed - 4.1) / .9), angle = mix(-.52 + Math.sin(elapsed * .42) * .09, 0, gather), q = (x: number, y: number, z: number) => project(x, y, z, angle);
        ctx.save();
        ctx.translate(w / 2, h * .79);
        ctx.scale(1, .19);
        const radius = Math.min(w * .38, 175), shadow = ctx.createRadialGradient(0, 0, 0, 0, 0, radius);
        shadow.addColorStop(0, 'rgba(109,63,216,.28)');
        shadow.addColorStop(.4, 'rgba(109,63,216,.12)');
        shadow.addColorStop(1, 'rgba(109,63,216,0)');
        ctx.fillStyle = shadow;
        ctx.beginPath();
        ctx.arc(0, 0, radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        ctx.globalAlpha = fade;
        const glass = 1 - escape;
        if (glass > 0) {
            ctx.globalAlpha = glass;
            const faces: [
                number,
                number,
                number
            ][][] = [
                [[-.33, -.33, -.33], [.33, -.33, -.33], [.33, .33, -.33], [-.33, .33, -.33]],
                [[.33, -.33, -.33], [.33, -.33, .33], [.33, .33, .33], [.33, .33, -.33]],
                [[-.33, -.33, -.33], [-.33, -.33, .33], [.33, -.33, .33], [.33, -.33, -.33]],
                [[-.33, -.33, .33], [.33, -.33, .33], [.33, .33, .33], [-.33, .33, .33]]
            ];
            faces.forEach((face, i) => { const p = face.map(v => q(...v)), g = ctx.createLinearGradient(p[0].x, p[0].y, p[2].x, p[2].y); g.addColorStop(0, i === 2 ? 'rgba(255,255,255,.75)' : 'rgba(217,204,255,.45)'); g.addColorStop(.48, 'rgba(233,201,242,.18)'); g.addColorStop(1, 'rgba(185,160,255,.35)'); ctx.shadowColor = '#b9a3ff'; ctx.shadowBlur = i === 2 ? 14 : 4; polygon(p, g, i === 2 ? '#ffffff' : 'rgba(139,108,240,.55)', i === 2 ? 1.7 : 1); });
            ctx.shadowBlur = 0;
        }
        ctx.globalAlpha = fade;
        pieces.map((p, i) => {
            const x = mix(mix(p.x, p.ex, escape), p.rx, gather), y = mix(mix(p.y, p.ey, escape), p.ry, gather), z = mix(mix(p.z, p.ez, escape), 0, gather);
            return { ...q(x, y, z), p, i };
        }).sort((a, b) => b.z - a.z).forEach(({ x, y, k, p, i }) => {
            const s = (p.accent ? 4 : 2.6) * k;
            ctx.fillStyle = p.accent ? breachColour : dotColour;
            ctx.fillRect(x - s / 2, y - s / 2, s, s);
            if (escape > .6 && gather < .65 && i % 18 === 0) {
                ctx.fillStyle = '#f2eaff';
                ctx.font = '10px Consolas,monospace';
                ctx.fillText(String(1000 + i * 37), x + 8, y);
            }
        });
        ctx.globalAlpha = 1;
    }
    function allowed() { return !disposed && !paused && !reduced && !document.hidden && inView && elapsed < 5.2; }
    function tick(stamp: number) {
        frame = 0;
        if (!allowed())
            return;
        const delta = last ? Math.min((stamp - last) / 1000, .05) : 0;
        last = stamp;
        elapsed = Math.min(5.2, elapsed + delta);
        draw();
        if (allowed())
            frame = requestAnimationFrame(tick);
    }
    function sync() {
        if (disposed)
            return;
        if (frame)
            cancelAnimationFrame(frame);
        frame = 0;
        last = 0;
        draw();
        if (allowed())
            frame = requestAnimationFrame(tick);
    }
    function resize() {
        const bounds = visual.getBoundingClientRect();
        w = bounds.width;
        h = bounds.height;
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        canvas.width = Math.round(w * dpr);
        canvas.height = Math.round(h * dpr);
        context?.setTransform(dpr, 0, 0, dpr, 0, 0);
        draw();
    }
    function replay() { if (reduced || !context || disposed)
        return; elapsed = 0; paused = false; sync(); }
    function preferenceChanged() { reduced = pref.matches; if (reduced)
        elapsed = 5.2; sync(); }
    pref.addEventListener("change", preferenceChanged);
    document.addEventListener("visibilitychange", sync);
    const resizeObserver = typeof ResizeObserver !== "undefined" ? new ResizeObserver(resize) : null;
    resizeObserver?.observe(visual);
    if (!resizeObserver)
        window.addEventListener("resize", resize, { passive: true });
    const intersectionObserver = typeof IntersectionObserver !== "undefined" ? new IntersectionObserver(([entry]) => {
        inView = entry.isIntersecting;
        if (!inView && entry.boundingClientRect.bottom <= 0) elapsed = 5.2;
        sync();
    }, { threshold: .05 }) : null;
    intersectionObserver?.observe(visual);
    resize();
    sync();
    return {
        toggle() { if (elapsed >= 5.2)
            replay();
        else {
            paused = !paused;
            sync();
        } },
        replay,
        finish() { elapsed = 5.2; sync(); },
        dispose() {
            disposed = true;
            if (frame)
                cancelAnimationFrame(frame);
            resizeObserver?.disconnect();
            intersectionObserver?.disconnect();
            window.removeEventListener("resize", resize);
            pref.removeEventListener("change", preferenceChanged);
            document.removeEventListener("visibilitychange", sync);
        },
    };
}
