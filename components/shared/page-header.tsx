export function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex items-center justify-between gap-4">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight text-navy-900">{title}</h2>
        <p className="mt-1 text-sm text-navy-900/65">{description}</p>
      </div>
      {action}
    </div>
  );
}
