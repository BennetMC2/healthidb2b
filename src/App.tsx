import { useState, useCallback, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Joyride, { STATUS } from 'react-joyride';
import Layout from '@/components/layout/Layout';
import Actuary from '@/pages/Actuary';
import NetworkExplorer from '@/pages/NetworkExplorer';
import Campaigns from '@/pages/Campaigns';
import CampaignDetail from '@/pages/CampaignDetail';
import CampaignMemberDetail from '@/pages/CampaignMemberDetail';
import CampaignCreate from '@/pages/CampaignCreate';
import Treasury from '@/pages/Treasury';
import Compliance from '@/pages/Compliance';
import Settings from '@/pages/Settings';
import DemoWalkthrough from '@/components/walkthrough/DemoWalkthrough';
import ToastContainer from '@/components/ui/Toast';
import { useDemoStore } from '@/stores/useDemoStore';
import { tourSteps } from '@/utils/tourSteps';
import ErrorBoundary from '@/components/ui/ErrorBoundary';
import NotFound from '@/pages/NotFound';
import FutureLayout from '@/future/FutureLayout';
import FutureStrategy from '@/future/pages/FutureStrategy';
import FuturePopulation from '@/future/pages/FuturePopulation';
import FutureExecution from '@/future/pages/FutureExecution';
import FutureDecisions from '@/future/pages/FutureDecisions';
import FutureTrust from '@/future/pages/FutureTrust';

export default function App() {
  const [runTour, setRunTour] = useState(false);
  const demoActive = useDemoStore((s) => s.isActive);
  const location = useLocation();

  useEffect(() => {
    const path = location.pathname;
    const meta: Record<string, { title: string; description: string; robots?: string }> = {
      '/': {
        title: 'Member Pool · HealthID',
        description: 'Explore anonymized verified health cohorts and trust tiers.',
        robots: 'noindex',
      },
      '/app/actuary': {
        title: 'AI Actuary · HealthID',
        description: 'Always-on actuarial intelligence for verified health cohorts, campaign design, and evidence trails.',
        robots: 'noindex',
      },
      '/app/campaigns': {
        title: 'Campaign Engine · HealthID',
        description: 'Design and launch privacy-preserving verified outcome campaigns.',
        robots: 'noindex',
      },
      '/app/explorer': {
        title: 'Member Pool · HealthID',
        description: 'Explore anonymized verified health cohorts and trust tiers.',
        robots: 'noindex',
      },
      '/app/compliance': {
        title: 'Verification Trail · HealthID',
        description: 'Audit-grade proof receipts and zero-PII verification records.',
        robots: 'noindex',
      },
      '/app/settings': {
        title: 'Settings · HealthID',
        description: 'Partner configuration and verification policy settings.',
        robots: 'noindex',
      },
    };

    const exact = meta[path];
    const fallback = path.startsWith('/app/campaigns/')
      ? meta['/app/campaigns']
      : path.startsWith('/app/explorer')
        ? meta['/app/explorer']
        : path.startsWith('/app/compliance')
          ? meta['/app/compliance']
          : exact;

    const active = fallback ?? meta['/'];
    document.title = active.title;

    const description = document.querySelector('meta[name="description"]');
    description?.setAttribute('content', active.description);

    let robots = document.querySelector('meta[name="robots"]');
    if (active.robots) {
      if (!robots) {
        robots = document.createElement('meta');
        robots.setAttribute('name', 'robots');
        document.head.appendChild(robots);
      }
      robots.setAttribute('content', active.robots);
    } else {
      robots?.remove();
    }
  }, [location.pathname]);

  const handleTourStart = useCallback(() => {
    setRunTour(true);
  }, []);

  const handleTourCallback = useCallback((data: { status: string }) => {
    if ([STATUS.FINISHED, STATUS.SKIPPED].includes(data.status as typeof STATUS.FINISHED)) {
      setRunTour(false);
    }
  }, []);

  return (
    <>
      <DemoWalkthrough />
      <ToastContainer />
      <Joyride
        steps={tourSteps}
        run={runTour && !demoActive}
        continuous
        showSkipButton
        showProgress
        callback={handleTourCallback}
        styles={{
          options: {
            arrowColor: '#FFFFFF',
            backgroundColor: '#FFFFFF',
            overlayColor: 'rgba(27, 42, 74, 0.4)',
            primaryColor: '#E07A5F',
            textColor: '#1B2A4A',
            zIndex: 10000,
          },
          tooltip: {
            borderRadius: '12px',
            fontSize: '12px',
            padding: '12px 16px',
          },
          tooltipTitle: {
            fontSize: '13px',
            fontWeight: 600,
            marginBottom: '4px',
          },
          tooltipContent: {
            fontSize: '12px',
            lineHeight: '1.4',
            color: '#4A5568',
            padding: '8px 0',
          },
          buttonNext: {
            backgroundColor: '#E07A5F',
            borderRadius: '8px',
            fontSize: '11px',
            padding: '4px 12px',
          },
          buttonBack: {
            color: '#4A5568',
            fontSize: '11px',
          },
          buttonSkip: {
            color: '#8896AB',
            fontSize: '11px',
          },
          spotlight: {
            borderRadius: '12px',
          },
        }}
      />
      <ErrorBoundary fallbackTitle="Page failed to load">
        <Routes>
          <Route path="/" element={<Navigate to="/app/explorer" replace />} />
          <Route path="/overview" element={<Navigate to="/app/explorer" replace />} />
          <Route path="/contact" element={<Navigate to="/app/explorer" replace />} />
          <Route path="/future" element={<FutureLayout />}>
            <Route index element={<Navigate to="/future/strategy" replace />} />
            <Route path="strategy" element={<FutureStrategy />} />
            <Route path="population" element={<FuturePopulation />} />
            <Route path="execution" element={<FutureExecution />} />
            <Route path="decisions" element={<FutureDecisions />} />
            <Route path="trust" element={<FutureTrust />} />
          </Route>
          <Route element={<Layout onTourStart={handleTourStart} />}>
            <Route path="/app" element={<Navigate to="/app/actuary" replace />} />
            <Route path="/app/actuary" element={<Actuary />} />
            <Route path="/app/explorer" element={<NetworkExplorer />} />
            <Route path="/app/campaigns" element={<Campaigns />} />
            <Route path="/app/campaigns/new" element={<CampaignCreate />} />
            <Route path="/app/campaigns/:id" element={<CampaignDetail />} />
            <Route path="/app/campaigns/:id/members/:memberId" element={<CampaignMemberDetail />} />
            <Route path="/app/treasury" element={<Treasury />} />
            <Route path="/app/compliance" element={<Compliance />} />
            <Route path="/app/settings" element={<Settings />} />
            <Route path="*" element={<NotFound />} />
          </Route>
          <Route path="/campaigns" element={<Navigate to="/app/campaigns" replace />} />
          <Route path="/campaigns/new" element={<Navigate to="/app/campaigns/new" replace />} />
          <Route path="/campaigns/:id" element={<Navigate to="/app/campaigns" replace />} />
          <Route path="/explorer" element={<Navigate to="/app/explorer" replace />} />
          <Route path="/compliance" element={<Navigate to="/app/compliance" replace />} />
          <Route path="/settings" element={<Navigate to="/app/settings" replace />} />
          <Route path="/treasury" element={<Navigate to="/app/treasury" replace />} />
        </Routes>
      </ErrorBoundary>
    </>
  );
}
