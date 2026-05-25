type EnterpriseTableProps = {
  children: React.ReactNode;
};

export const EnterpriseTable = ({ children }: EnterpriseTableProps) => {
  return (
    <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-lg shadow-slate-200/70">
      <div className="overflow-x-auto">{children}</div>
    </div>
  );
};