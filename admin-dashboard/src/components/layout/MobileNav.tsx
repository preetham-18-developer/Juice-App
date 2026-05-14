'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Package, ShoppingCart, Settings } from 'lucide-react';

const MobileNav = () => {
  const pathname = usePathname();
  
  const menuItems = [
    { icon: LayoutDashboard, label: 'Dash', href: '/' },
    { icon: Package, label: 'Stock', href: '/stock' },
    { icon: ShoppingCart, label: 'Orders', href: '/orders' },
    { icon: Settings, label: 'More', href: '/settings' },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-md border-t border-gray-200 p-2 flex justify-around items-center md:hidden z-50">
      {menuItems.map((item) => {
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.label}
            href={item.href}
            className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all duration-300 ${
              isActive
                ? 'text-[#EF4444]'
                : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            <item.icon size={20} strokeWidth={isActive ? 2.5 : 2} />
            <span className={`text-[10px] mt-1 font-bold ${isActive ? 'opacity-100' : 'opacity-70'}`}>
              {item.label}
            </span>
            {isActive && (
              <div className="absolute -bottom-1 w-1 h-1 bg-[#EF4444] rounded-full" />
            )}
          </Link>
        );
      })}
    </div>
  );
};

export default MobileNav;
