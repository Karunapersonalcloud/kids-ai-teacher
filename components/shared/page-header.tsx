export function PageHeader({
  title,
  subtitle,
  badge,
  actions,
}: {
  title: string;
  subtitle?: string;
  badge?: string;
  actions?: React.ReactNode;
}) {
  return (
    <section className="mb-5 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div>
          {badge && <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black uppercase tracking-wide text-slate-600">{badge}</span>}
          <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-950 md:text-4xl">{title}</h1>
          {subtitle && <p className="mt-2 max-w-4xl text-sm font-semibold leading-6 text-slate-600 md:text-base">{subtitle}</p>}
        </div>
        {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
      </div>
    </section>
  );
}
