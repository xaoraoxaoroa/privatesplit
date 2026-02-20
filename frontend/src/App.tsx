import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { WalletProvider } from './hooks/WalletProvider';
import { Shell } from './components/layout/Shell';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Dashboard } from './pages/Dashboard';
import { CreateSplit } from './pages/CreateSplit';
import { PaySplit } from './pages/PaySplit';
import { SplitDetail } from './pages/SplitDetail';
import { MySplits } from './pages/MySplits';
import { Connect } from './pages/Connect';
import { Explorer } from './pages/Explorer';
import { Verification } from './pages/Verification';
import { Privacy } from './pages/Privacy';
import { Vision } from './pages/Vision';
import { Docs } from './pages/Docs';
import { Audit } from './pages/Audit';

export default function App() {
  return (
    <ErrorBoundary>
      <WalletProvider>
        <BrowserRouter>
          <Routes>
            <Route element={<Shell />}>
              <Route path="/" element={<ErrorBoundary><Dashboard /></ErrorBoundary>} />
              <Route path="/create" element={<ErrorBoundary><CreateSplit /></ErrorBoundary>} />
              <Route path="/pay" element={<ErrorBoundary><PaySplit /></ErrorBoundary>} />
              <Route path="/split/:hash" element={<ErrorBoundary><SplitDetail /></ErrorBoundary>} />
              <Route path="/history" element={<Navigate to="/my-splits" replace />} />
              <Route path="/my-splits" element={<ErrorBoundary><MySplits /></ErrorBoundary>} />
              <Route path="/explorer" element={<ErrorBoundary><Explorer /></ErrorBoundary>} />
              <Route path="/verify" element={<ErrorBoundary><Verification /></ErrorBoundary>} />
              <Route path="/audit" element={<ErrorBoundary><Audit /></ErrorBoundary>} />
              <Route path="/privacy" element={<ErrorBoundary><Privacy /></ErrorBoundary>} />
              <Route path="/vision" element={<ErrorBoundary><Vision /></ErrorBoundary>} />
              <Route path="/docs" element={<ErrorBoundary><Docs /></ErrorBoundary>} />
              <Route path="/connect" element={<ErrorBoundary><Connect /></ErrorBoundary>} />
            </Route>
          </Routes>
        </BrowserRouter>
      </WalletProvider>
    </ErrorBoundary>
  );
}
