export function SectionHeader({ title, icon }: { title: string; icon?: string }) {
  return (
    <div className="flex items-center gap-2 pb-2 mb-3 border-b-2 border-[#0071c2]">
      <span className="w-1 h-4 bg-[#ffbb00] rounded-sm" />
      {icon && <span className="text-sm">{icon}</span>}
      <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wide">{title}</h3>
    </div>
  );
}
