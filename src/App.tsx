import { useState, useCallback } from 'react';
import { Routes, Route } from 'react-router-dom';
import Joyride, { STATUS } from 'react-joyride';
import Layout from '@/components/layout/Layout';
import NetworkExplorer from '@/pages/NetworkExplorer';
import Campaigns from '@/pages/Campaigns';
import CampaignDetail from '@/pages/CampaignDetail';
import CampaignCreate from '@/pages/CampaignCreate';
import Treasury from '@/pages/Treasury';
import Compliance from '@/pages/Compliance';
import Settings from '@/pages/Settings';
import Overview from '@/pages/Overview';
import DemoWalkthrough from '@/components/walkthrough/DemoWalkthrough';
import ToastContainer from '@/components/ui/Toast';
import { useDemoStore } from '@/stores/useDemoStore';
import { tourSteps } from '@/utils/tourSteps';
import ErrorBoundary from '@/components/ui/ErrorBoundary';
import NotFound from '@/pages/NotFound';

export default function App() {
  const [runTour, setRunTour] = useState(false);
  const demoActive = useDemoStore((s) => s.isActive);

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
          <Route element={<Layout onTourStart={handleTourStart} />}>
            <Route path="/overview" element={<Overview />} />
            <Route path="/explorer" element={<NetworkExplorer />} />
            <Route path="/campaigns" element={<Campaigns />} />
            <Route path="/campaigns/new" element={<CampaignCreate />} />
            <Route path="/campaigns/:id" element={<CampaignDetail />} />
            <Route path="/treasury" element={<Treasury />} />
            <Route path="/compliance" element={<Compliance />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </ErrorBoundary>
    </>
  );
}
