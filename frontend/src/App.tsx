import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { WalletProvider } from './hooks/WalletProvider';
import { Shell } from './components/layout/Shell';
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
    <WalletProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<Shell />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/create" element={<CreateSplit />} />
            <Route path="/pay" element={<PaySplit />} />
            <Route path="/split/:hash" element={<SplitDetail />} />
            <Route path="/history" element={<History />} />
            <Route path="/explorer" element={<Explorer />} />
            <Route path="/verify" element={<Verification />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/connect" element={<Connect />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </WalletProvider>
  );
}
