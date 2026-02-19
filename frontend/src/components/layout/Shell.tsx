import { Outlet, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { CommandBar } from './CommandBar';
import { StatusBar } from './StatusBar';
import { ToastContainer } from '../ui/Toast';
import { AnimatedBackground } from '../AnimatedBackground';

export function Shell() {
  const location = useLocation();

  return (
    <div className="flex flex-col min-h-screen bg-terminal-bg relative">
      <AnimatedBackground />
      <div className="relative z-10 flex flex-col min-h-screen">
        <CommandBar />
        <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-8">
          <AnimatePresence mode="wait">
            <Outlet key={location.pathname} />
          </AnimatePresence>
        </main>
        <StatusBar />
        <ToastContainer />
      </div>
    </div>
  );
}
