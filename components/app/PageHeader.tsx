export default function PageHeader({ title, intro, children }: { title: string; intro?: string; children?: React.ReactNode }) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-4 border-b border-rule pb-5">
      <div className="max-w-2xl">
        <h1 className="text-3xl font-bold tracking-[-0.01em]">{title}</h1>
        {intro && <p className="mt-2 text-muted">{intro}</p>}
      </div>
      {children}
    </header>
  );
}
