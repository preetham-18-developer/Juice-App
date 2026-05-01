'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Package, ShoppingCart, Settings } from 'lucide-react';

const Sidebar = () => {
  const pathname = usePathname();
  
  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', href: '/' },
    { icon: Package, label: 'Stock Management', href: '/stock' },
    { icon: ShoppingCart, label: 'Orders', href: '/orders' },
    { icon: Settings, label: 'Settings', href: '/settings' },
  ];

  return (
    <div className="w-64 bg-white h-screen border-r border-gray-200 fixed left-0 top-0 hidden md:flex flex-col">
      <div className="p-6 border-b border-gray-200">
        <h1 className="text-2xl font-bold text-[#EF4444]">🍎 JuiceShop</h1>
        <p className="text-xs text-gray-500 mt-1">Admin Dashboard</p>
      </div>
      <nav className="flex-1 p-4">
        {menuItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.label}
              href={item.href}
              className={`flex items-center space-x-3 p-3 rounded-lg transition-colors mb-1 ${
                isActive
                  ? 'bg-red-50 text-[#EF4444] font-bold'
                  : 'text-gray-600 hover:bg-red-50 hover:text-[#EF4444]'
              }`}
            >
              <item.icon size={20} />
              <span className="font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center space-x-3 p-3">
          <div className="w-8 h-8 rounded-full bg-[#EF4444] flex items-center justify-center text-white font-bold">
            A
          </div>
          <div>
            <p className="text-sm font-semibold">Admin User</p>
            <p className="text-xs text-gray-500">Shop Owner</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
