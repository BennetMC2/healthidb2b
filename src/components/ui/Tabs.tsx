interface Tab {
  id: string;
  label: string;
  count?: number;
}

interface TabsProps {
  tabs: Tab[];
  activeTab: string;
  onChange: (id: string) => void;
  className?: string;
}

export default function Tabs({ tabs, activeTab, onChange, className = '' }: TabsProps) {
  return (
    <div className={`flex items-center gap-0.5 border-b border-border ${className}`}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={`px-3 py-1.5 text-sm font-medium transition-colors duration-100 border-b-2 -mb-[1px] ${
            activeTab === tab.id
              ? 'text-accent border-accent'
              : 'text-tertiary border-transparent hover:text-secondary'
          }`}
        >
          {tab.label}
          {tab.count !== undefined && (
            <span
              className={`ml-1.5 text-2xs font-mono ${
                activeTab === tab.id ? 'text-accent/60' : 'text-tertiary'
              }`}
            >
              {tab.count}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
