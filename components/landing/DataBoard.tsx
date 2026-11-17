"use client";

import { useEffect, useRef, useState } from "react";

// "Drag to explore": the personal data a typical SME holds without noticing.
const ITEMS = [
  { title: "Customer list", where: "Google Sheet", fields: ["Name", "Phone", "Email", "Address"], x: 6, y: 10, tone: "a" },
  { title: "Staff payroll", where: "Accounting laptop", fields: ["Name", "IC number", "Bank account", "Salary"], x: 34, y: 4, tone: "b" },
  { title: "CCTV footage", where: "Shop recorder", fields: ["Faces", "Car plates", "Time of visit"], x: 63, y: 12, tone: "c" },
  { title: "WhatsApp groups", where: "Staff phones", fields: ["Names", "Phone numbers", "Photos", "Addresses"], x: 88, y: 6, tone: "a" },
  { title: "Online orders", where: "Shopee / website", fields: ["Name", "Address", "Phone", "Order history"], x: 14, y: 52, tone: "c" },
  { title: "Job applications", where: "Email inbox", fields: ["Resume", "IC number", "Date of birth", "Past salary"], x: 44, y: 46, tone: "a" },
  { title: "Loyalty members", where: "POS system", fields: ["Name", "Phone", "Birthday", "Spending"], x: 72, y: 54, tone: "b" },
  { title: "Staff medical leave", where: "HR folder", fields: ["Name", "Medical certificate", "Illness"], x: 100, y: 48, tone: "d" },
  { title: "Visitor logbook", where: "Front desk", fields: ["Name", "IC number", "Phone"], x: 26, y: 90, tone: "b" },
  { title: "Delivery addresses", where: "Courier app", fields: ["Name", "Address", "Phone"], x: 58, y: 92, tone: "a" },
  { title: "Supplier invoices", where: "Accounts folder", fields: ["Contact name", "Bank account", "Phone"], x: 88, y: 90, tone: "c" },
];

const TONE: Record<string, string> = {
  a: "bg-white",
  b: "bg-[#eaf1fb]",
  c: "bg-[#eef6f1]",
  d: "bg-[#fdeeee]",
};

export default function DataBoard() {
  const viewport = useRef<HTMLDivElement>(null);
  const drag = useRef<{ x: number; y: number; sl: number; st: number; moved: boolean } | null>(null);
  const [open, setOpen] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);

  // Start in the middle of the board.
  useEffect(() => {
    const v = viewport.current;
    if (v) v.scrollLeft = (v.scrollWidth - v.clientWidth) / 2;
  }, []);

  // Drag to pan with the mouse; touch and trackpads scroll natively.
  const onPointerDown = (e: React.PointerEvent) => {
    if (e.pointerType !== "mouse" || !viewport.current) return;
    drag.current = { x: e.clientX, y: e.clientY, sl: viewport.current.scrollLeft, st: viewport.current.scrollTop, moved: false };
  };
  const onPointerMove = (e: React.PointerEvent) => {
    const d = drag.current;
    const v = viewport.current;
    if (!d || !v) return;
    const dx = e.clientX - d.x;
    const dy = e.clientY - d.y;
    if (!d.moved && Math.hypot(dx, dy) > 4) {
      d.moved = true;
      setDragging(true);
    }
    v.scrollLeft = d.sl - dx;
    v.scrollTop = d.st - dy;
  };
  const endDrag = () => {
    setTimeout(() => setDragging(false), 0);
    drag.current = null;
  };

  return (
    <div className="relative">
      <div
        ref={viewport}
        tabIndex={0}
        data-lenis-prevent
        aria-label="Board of personal data a business may hold. Drag or scroll to explore."
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerLeave={endDrag}
        className={`board-viewport h-[30rem] overflow-auto rounded-3xl border border-rule bg-[radial-gradient(circle,_#cfd6de_1px,_transparent_1px)] [background-size:22px_22px] ${
          dragging ? "cursor-grabbing select-none" : "cursor-grab"
        }`}
      >
        <ul className="relative h-[46rem] w-[110rem] sm:w-[120rem]">
          {ITEMS.map((it, i) => {
            const isOpen = open === it.title;
            return (
              <li
                key={it.title}
                className="board-item absolute"
                style={{ left: `${it.x * 0.88 + 2}%`, top: `${it.y * 0.82 + 3}%`, ["--r" as string]: `${(i % 3) - 1}deg` }}
              >
                <button
                  type="button"
                  aria-expanded={isOpen}
                  onClick={() => !dragging && setOpen(isOpen ? null : it.title)}
                  onMouseEnter={() => !dragging && setOpen(it.title)}
                  onMouseLeave={() => setOpen((o) => (o === it.title ? null : o))}
                  className={`w-60 rounded-2xl border border-rule p-4 text-left shadow-[0_14px_30px_-18px_rgba(23,33,58,0.4)] transition-transform duration-300 ${TONE[it.tone]} ${
                    isOpen ? "scale-105 border-ink" : ""
                  }`}
                >
                  <span className="block text-lg font-bold">{it.title}</span>
                  <span className="block text-sm text-muted">{it.where}</span>
                  <span className={`grid transition-[grid-template-rows] duration-300 ${isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
                    <span className="overflow-hidden">
                      <span className="mt-3 flex flex-wrap gap-1.5">
                        {it.fields.map((fl) => (
                          <span key={fl} className="rounded-full bg-ink px-2 py-0.5 text-xs text-white">
                            {fl}
                          </span>
                        ))}
                      </span>
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
      <p className="mt-3 text-sm text-muted">Drag the board, or scroll it. Hover or tap a card to see the personal data inside.</p>
    </div>
  );
}
