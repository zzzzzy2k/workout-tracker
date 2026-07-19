import { Search } from "lucide-react";

interface Option {
  value: string;
  label: string;
}

interface FilterBarProps {
  search: string;
  onSearchChange: (v: string) => void;
  selectedBodyPart: string;
  onBodyPartChange: (v: string) => void;
  selectedEquipment: string;
  onEquipmentChange: (v: string) => void;
  bodyPartOptions: Option[];
  equipmentOptions: Option[];
}

function Pill({
  active, children, onClick,
}: { active: boolean; children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`text-xs px-3 py-1.5 rounded-full whitespace-nowrap font-medium transition-all ${
        active
          ? "bg-tangerine-500 text-white shadow-sm"
          : "bg-white text-cocoa-500 border border-tangerine-100/50 hover:bg-tangerine-50"
      }`}
    >
      {children}
    </button>
  );
}

export default function FilterBar({
  search, onSearchChange,
  selectedBodyPart, onBodyPartChange,
  selectedEquipment, onEquipmentChange,
  bodyPartOptions, equipmentOptions,
}: FilterBarProps) {
  return (
    <div className="space-y-3">
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-cocoa-400" />
        <input
          type="text"
          placeholder="搜索动作..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-white border border-tangerine-100/50
                     text-sm text-cocoa-900 placeholder-cocoa-400
                     focus:outline-none focus:ring-2 focus:ring-tangerine-300 focus:border-transparent
                     transition-all"
        />
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        <Pill active={!selectedBodyPart} onClick={() => onBodyPartChange("")}>全部</Pill>
        {bodyPartOptions.map((opt) => (
          <Pill
            key={opt.value}
            active={selectedBodyPart === opt.value}
            onClick={() => onBodyPartChange(selectedBodyPart === opt.value ? "" : opt.value)}
          >
            {opt.label}
          </Pill>
        ))}
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        <Pill active={!selectedEquipment} onClick={() => onEquipmentChange("")}>所有器械</Pill>
        {equipmentOptions.map((opt) => (
          <Pill
            key={opt.value}
            active={selectedEquipment === opt.value}
            onClick={() => onEquipmentChange(selectedEquipment === opt.value ? "" : opt.value)}
          >
            {opt.label}
          </Pill>
        ))}
      </div>
    </div>
  );
}
