import React from 'react';
import { Outlet } from 'react-router-dom';
import { AppSidebar } from './AppSidebar';
import { Navbar } from './Navbar';
import { useAppSelector } from '../redux/store';

const ProtectedLayout: React.FC = () => {
  const { user } = useAppSelector((state) => state.auth);
  
  return (
    <div className="flex h-screen bg-gray-50">
      <AppSidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Navbar userName={`${user?.firstName || ''} ${user?.lastName || ''}`} />
        <main className="flex-1 overflow-y-auto p-4">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default ProtectedLayout; 