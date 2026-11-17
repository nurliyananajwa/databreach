export default function ComingSoon({ sprint, what }: { sprint: number; what: string }) {
  return (
    <div className="mt-8 max-w-xl rounded-md border border-dashed border-rule bg-sheet p-6">
      <p className="font-bold">Built in Sprint {sprint}</p>
      <p className="mt-1 text-muted">{what}</p>
    </div>
  );
}
