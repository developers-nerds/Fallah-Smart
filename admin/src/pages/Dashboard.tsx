import React from 'react';
import { useAppSelector } from '../redux/store';

function Dashboard() {
  const { user } = useAppSelector((state) => state.auth);

  return (
    <>
     

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-xl bg-white p-4 shadow-md">
          <h2 className="text-xl font-semibold text-[#1A2F2B]">Recent Activity</h2>
          <div className="mt-4 h-40 rounded-lg bg-[#E8F5F3]"></div>
        </div>
        <div className="rounded-xl bg-white p-4 shadow-md">
          <h2 className="text-xl font-semibold text-[#1A2F2B]">Stock Overview</h2>
          <div className="mt-4 h-40 rounded-lg bg-[#F5F6E8]"></div>
        </div>
        <div className="rounded-xl bg-white p-4 shadow-md">
          <h2 className="text-xl font-semibold text-[#1A2F2B]">Market Prices</h2>
          <div className="mt-4 h-40 rounded-lg bg-[#FDF0F3]"></div>
        </div>
      </div>

      <div className="mt-6 rounded-xl bg-white p-4 shadow-md">
        <h2 className="text-xl font-semibold text-[#1A2F2B]">Crop Performance</h2>
        <div className="mt-4 h-64 rounded-lg bg-[#E8F5F3]"></div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <div className="rounded-xl bg-white p-4 shadow-md">
          <h2 className="text-xl font-semibold text-[#1A2F2B]">Weather Forecast</h2>
          <div className="mt-4 h-48 rounded-lg bg-[#F5F6E8]"></div>
        </div>
        <div className="rounded-xl bg-white p-4 shadow-md">
          <h2 className="text-xl font-semibold text-[#1A2F2B]">Upcoming Tasks</h2>
          <div className="mt-4 h-48 rounded-lg bg-[#FDF0F3]"></div>
        </div>
      </div>
    </>
  )
}

export default Dashboard

