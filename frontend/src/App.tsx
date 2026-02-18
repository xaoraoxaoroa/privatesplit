import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { WalletProvider } from './hooks/WalletProvider';
import { Shell } from './components/layout/Shell';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Dashboard } from './pages/Dashboard';
import { CreateSplit } from './pages/CreateSplit';
import { PaySplit } from './pages/PaySplit';
import { SplitDetail } from './pages/SplitDetail';
import { History } from './pages/History';
import { Connect } from './pages/Connect';
import { Explorer } from './pages/Explorer';
import { Verification } from './pages/Verification';
import { Privacy } from './pages/Privacy';

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
              <Route path="/history" element={<ErrorBoundary><History /></ErrorBoundary>} />
              <Route path="/explorer" element={<ErrorBoundary><Explorer /></ErrorBoundary>} />
              <Route path="/verify" element={<ErrorBoundary><Verification /></ErrorBoundary>} />
              <Route path="/privacy" element={<ErrorBoundary><Privacy /></ErrorBoundary>} />
              <Route path="/connect" element={<ErrorBoundary><Connect /></ErrorBoundary>} />
            </Route>
          </Routes>
        </BrowserRouter>
      </WalletProvider>
    </ErrorBoundary>
  );
}
