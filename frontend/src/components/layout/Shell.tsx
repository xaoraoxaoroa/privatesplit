import { Outlet } from 'react-router-dom';
import { CommandBar } from './CommandBar';
import { StatusBar } from './StatusBar';
import { ToastContainer } from '../ui/Toast';

export function Shell() {
  return (
    <div className="flex flex-col min-h-screen bg-terminal-bg">
      <CommandBar />
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-6">
        <Outlet />
      </main>
      <StatusBar />
      <ToastContainer />
    </div>
  );
}
