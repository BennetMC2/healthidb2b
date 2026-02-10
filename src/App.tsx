import { useState, useCallback } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
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
import { useDemoStore } from '@/stores/useDemoStore';
import { tourSteps } from '@/utils/tourSteps';

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
      <Joyride
        steps={tourSteps}
        run={runTour && !demoActive}
        continuous
        showSkipButton
        showProgress
        callback={handleTourCallback}
        styles={{
          options: {
            arrowColor: '#161920',
            backgroundColor: '#161920',
            overlayColor: 'rgba(0, 0, 0, 0.6)',
            primaryColor: '#4ca5ff',
            textColor: '#e2e4e9',
            zIndex: 10000,
          },
          tooltip: {
            borderRadius: '4px',
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
            color: '#8b8fa3',
            padding: '8px 0',
          },
          buttonNext: {
            backgroundColor: '#4ca5ff',
            borderRadius: '4px',
            fontSize: '11px',
            padding: '4px 12px',
          },
          buttonBack: {
            color: '#8b8fa3',
            fontSize: '11px',
          },
          buttonSkip: {
            color: '#5c6070',
            fontSize: '11px',
          },
          spotlight: {
            borderRadius: '4px',
          },
        }}
      />
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
          <Route path="*" element={<Navigate to="/overview" replace />} />
        </Route>
      </Routes>
    </>
  );
}
