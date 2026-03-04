import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Target, Vault, ShieldCheck, AlertCircle, TrendingUp } from 'lucide-react';
import { campaigns, treasuryState } from '@/data';
import { formatCurrency } from '@/utils/format';

interface Notification {
  id: string;
  icon: typeof Target;
  iconColor: string;
  title: string;
  description: string;
  time: string;
  route: string;
}

function buildNotifications(): Notification[] {
  const activeCampaigns = campaigns.filter((c) => c.status === 'active');
  const completedCampaigns = campaigns.filter((c) => c.status === 'completed');

  const items: Notification[] = [];

  if (activeCampaigns[0]) {
    items.push({
      id: 'n1',
      icon: Target,
      iconColor: 'text-accent',
      title: `${activeCampaigns[0].name} milestone`,
      description: `${activeCampaigns[0].funnel.verified} verifications completed`,
      time: '2h ago',
      route: `/campaigns/${activeCampaigns[0].id}`,
    });
  }

  items.push({
    id: 'n2',
    icon: Vault,
    iconColor: 'text-accent',
    title: 'Treasury yield credited',
    description: `${formatCurrency(treasuryState.yieldGenerated)} total yield accrued`,
    time: '4h ago',
    route: '/treasury',
  });

  if (completedCampaigns[0]) {
    items.push({
      id: 'n3',
      icon: ShieldCheck,
      iconColor: 'text-success',
      title: 'Campaign completed',
      description: `${completedCampaigns[0].name} finished successfully`,
      time: '1d ago',
      route: `/campaigns/${completedCampaigns[0].id}`,
    });
  }

  items.push({
    id: 'n4',
    icon: TrendingUp,
    iconColor: 'text-accent',
    title: 'Value multiplier update',
    description: `Current multiplier: ${treasuryState.valueMultiplier.toFixed(2)}x`,
    time: '1d ago',
    route: '/treasury',
  });

  items.push({
    id: 'n5',
    icon: AlertCircle,
    iconColor: 'text-warning',
    title: 'Budget threshold alert',
    description: 'Active campaigns approaching 80% budget utilization',
    time: '2d ago',
    route: '/campaigns',
  });

  items.push({
    id: 'n6',
    icon: ShieldCheck,
    iconColor: 'text-success',
    title: 'Compliance audit passed',
    description: 'Monthly audit completed — zero PII events confirmed',
    time: '3d ago',
    route: '/compliance',
  });

  return items;
}

export default function NotificationDropdown() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const notifications = buildNotifications();

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="relative w-[28px] h-[28px] flex items-center justify-center rounded text-tertiary hover:text-secondary hover:bg-hover transition-colors"
      >
        <Bell size={14} />
        <span className="absolute top-0.5 right-0.5 min-w-[14px] h-[14px] flex items-center justify-center bg-accent rounded-full text-[9px] font-bold text-white">
          {notifications.length}
        </span>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 w-[340px] bg-surface border border-border rounded shadow-lg z-50 animate-fade-in">
          <div className="px-3 py-2 border-b border-border">
            <span className="text-xs font-medium text-primary">Notifications</span>
          </div>
          <div className="max-h-[320px] overflow-auto scrollbar-thin">
            {notifications.map((n) => {
              const Icon = n.icon;
              return (
                <button
                  key={n.id}
                  onClick={() => {
                    navigate(n.route);
                    setOpen(false);
                  }}
                  className="w-full flex items-start gap-2.5 px-3 py-2.5 hover:bg-hover transition-colors text-left border-b border-border/50"
                >
                  <Icon size={14} className={`${n.iconColor} flex-shrink-0 mt-0.5`} />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-primary">{n.title}</div>
                    <div className="text-2xs text-tertiary mt-0.5">{n.description}</div>
                  </div>
                  <span className="text-2xs text-tertiary flex-shrink-0">{n.time}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
