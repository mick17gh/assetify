export function BrandWordmark({ className = "" }: { className?: string }) {
  return (
    <p className={`text-4xl font-semibold tracking-tight text-navy-900 ${className}`.trim()}>VortAsset</p>
  );
}
