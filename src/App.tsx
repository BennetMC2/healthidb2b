import { useCallback, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
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
import ErrorBoundary from '@/components/ui/ErrorBoundary';
import NotFound from '@/pages/NotFound';
import FutureLayout from '@/future/FutureLayout';
import FutureStrategy from '@/future/pages/FutureStrategy';
import FuturePopulation from '@/future/pages/FuturePopulation';
import FutureExecution from '@/future/pages/FutureExecution';
import FutureDecisions from '@/future/pages/FutureDecisions';
import FutureTrust from '@/future/pages/FutureTrust';
import SimulatorLayout from '@/simulator/SimulatorLayout';
import SimulatorOverview from '@/simulator/pages/Overview';
import ScenarioBuilder from '@/simulator/pages/ScenarioBuilder';
import CohortBuilder from '@/simulator/pages/CohortBuilder';
import SignalConfidence from '@/simulator/pages/SignalConfidence';
import EvidenceLibrary from '@/simulator/pages/EvidenceLibrary';
import InterventionBuilder from '@/simulator/pages/InterventionBuilder';
import RewardFunction from '@/simulator/pages/RewardFunction';
import SimulationRunner from '@/simulator/pages/SimulationRunner';
import OutputDashboard from '@/simulator/pages/OutputDashboard';
import HealthToValueBridge from '@/simulator/pages/HealthToValueBridge';
import AuditTrail from '@/simulator/pages/AuditTrail';
import SimulatorSettings from '@/simulator/pages/SimulatorSettings';
import ScenarioComparison from '@/simulator/pages/ScenarioComparison';
import ArchitectureDiagram from '@/simulator/pages/ArchitectureDiagram';
import ModelInspector from '@/simulator/pages/ModelInspector';

export default function App() {
  const startDemo = useDemoStore((s) => s.startDemo);
  const location = useLocation();

  useEffect(() => {
    const path = location.pathname;
    const meta: Record<string, { title: string; description: string; robots?: string }> = {
      '/': {
        title: 'AI Actuary · HealthID',
        description: 'AI Actuary cockpit for wearable signal campaigns priced with Health Points and measured against expected book value.',
        robots: 'noindex',
      },
      '/app/actuary': {
        title: 'AI Actuary · HealthID',
        description: 'AI Actuary cockpit for wearable signal campaigns priced with Health Points and measured against expected book value.',
        robots: 'noindex',
      },
      '/app/campaigns': {
        title: 'Campaign Studio · HealthID',
        description: 'Create Health Points campaigns for signal improvement, acquisition, retention, and engagement.',
        robots: 'noindex',
      },
      '/app/cohorts': {
        title: 'Cohorts · HealthID',
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
      : path.startsWith('/app/cohorts')
        ? meta['/app/cohorts']
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
    startDemo();
  }, [startDemo]);

  return (
    <>
      <DemoWalkthrough />
      <ToastContainer />
      <ErrorBoundary fallbackTitle="Page failed to load">
        <Routes>
          <Route path="/" element={<Navigate to="/app/actuary" replace />} />
          <Route path="/overview" element={<Navigate to="/app/actuary" replace />} />
          <Route path="/contact" element={<Navigate to="/app/cohorts" replace />} />
          <Route path="/future" element={<FutureLayout />}>
            <Route index element={<Navigate to="/future/strategy" replace />} />
            <Route path="strategy" element={<FutureStrategy />} />
            <Route path="population" element={<FuturePopulation />} />
            <Route path="execution" element={<FutureExecution />} />
            <Route path="decisions" element={<FutureDecisions />} />
            <Route path="trust" element={<FutureTrust />} />
          </Route>
          <Route path="/simulator" element={<SimulatorLayout />}>
            <Route index element={<Navigate to="/simulator/overview" replace />} />
            <Route path="overview" element={<SimulatorOverview />} />
            <Route path="architecture" element={<ArchitectureDiagram />} />
            <Route path="inspector" element={<ModelInspector />} />
            <Route path="scenario" element={<ScenarioBuilder />} />
            <Route path="cohort" element={<CohortBuilder />} />
            <Route path="signals" element={<SignalConfidence />} />
            <Route path="evidence" element={<EvidenceLibrary />} />
            <Route path="interventions" element={<InterventionBuilder />} />
            <Route path="rewards" element={<RewardFunction />} />
            <Route path="run" element={<SimulationRunner />} />
            <Route path="output" element={<OutputDashboard />} />
            <Route path="bridge" element={<HealthToValueBridge />} />
            <Route path="audit" element={<AuditTrail />} />
            <Route path="settings" element={<SimulatorSettings />} />
            <Route path="compare" element={<ScenarioComparison />} />
          </Route>
          <Route element={<Layout onTourStart={handleTourStart} />}>
            <Route path="/app" element={<Navigate to="/app/actuary" replace />} />
            <Route path="/app/actuary" element={<Actuary />} />
            <Route path="/app/cohorts" element={<NetworkExplorer />} />
            <Route path="/app/explorer" element={<Navigate to="/app/cohorts" replace />} />
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
          <Route path="/explorer" element={<Navigate to="/app/cohorts" replace />} />
          <Route path="/compliance" element={<Navigate to="/app/compliance" replace />} />
          <Route path="/settings" element={<Navigate to="/app/settings" replace />} />
          <Route path="/treasury" element={<Navigate to="/app/treasury" replace />} />
        </Routes>
      </ErrorBoundary>
    </>
  );
}
