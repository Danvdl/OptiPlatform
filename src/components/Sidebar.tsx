import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  IconDashboard,
  IconPackage,
  IconBuilding,
  IconShoppingCart,
  IconCoin,
  IconReceipt,
  IconChartBar,
  IconRobot,
  IconUsers,
  IconLogout,
} from '@tabler/icons-react';
import { Sidebar as SidebarContainer, SidebarBody, SidebarLink } from './ui/sidebar';
import { cn } from '../utils/cn';
import { clearToken } from '../utils/authStore';
import { useAuth } from '../contexts/AuthContext';
import { PermissionGuard, AccessGuard } from './PermissionGuards';
import { UserRole } from '../types/user-management';

export default function Sidebar() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  
  const handleLogout = async () => {
    await clearToken();
    window.location.href = '/login';
  };

  return (
    <SidebarContainer open={open} setOpen={setOpen}>
      <SidebarBody 
        className="justify-between gap-10" 
        style={{
          background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
        }}
      >
        <div className="flex flex-1 flex-col overflow-x-hidden overflow-y-auto">
          {open ? <Logo /> : <LogoIcon />}
          
          <div className="mt-8 flex flex-col gap-2">
            <CustomSidebarLink link={{ label: "Dashboard", href: "/dashboard", icon: <IconDashboard className="h-5 w-5 shrink-0 text-neutral-200" /> }} />
            <CustomSidebarLink link={{ label: "Inventory", href: "/inventory", icon: <IconPackage className="h-5 w-5 shrink-0 text-neutral-200" /> }} />
            <PermissionGuard permission="supplier:read">
              <CustomSidebarLink link={{ label: "Suppliers", href: "/suppliers", icon: <IconBuilding className="h-5 w-5 shrink-0 text-neutral-200" /> }} />
            </PermissionGuard>
            <PermissionGuard permission="purchase_order:read">
              <CustomSidebarLink link={{ label: "Purchase Orders", href: "/purchase-orders", icon: <IconShoppingCart className="h-5 w-5 shrink-0 text-neutral-200" /> }} />
            </PermissionGuard>
            <CustomSidebarLink link={{ label: "Pricing & Costs", href: "/pricing", icon: <IconCoin className="h-5 w-5 shrink-0 text-neutral-200" /> }} />
            <PermissionGuard permission="transaction:read">
              <CustomSidebarLink link={{ label: "Transactions", href: "/transactions", icon: <IconReceipt className="h-5 w-5 shrink-0 text-neutral-200" /> }} />
            </PermissionGuard>
            <PermissionGuard permission="reports:read">
              <CustomSidebarLink link={{ label: "Reports", href: "/reports", icon: <IconChartBar className="h-5 w-5 shrink-0 text-neutral-200" /> }} />
            </PermissionGuard>
            <PermissionGuard permission="reports:read">
              <CustomSidebarLink link={{ label: "ML Analytics", href: "/analytics", icon: <IconRobot className="h-5 w-5 shrink-0 text-purple-400" /> }} />
            </PermissionGuard>
            <AccessGuard roles={[UserRole.ADMIN]} permissions={['user:read']} requireAll={false}>
              <div className="border-t border-white/10 pt-4 mt-4">
                <CustomSidebarLink link={{ label: "User Management", href: "/users", icon: <IconUsers className="h-5 w-5 shrink-0 text-red-400" /> }} />
              </div>
            </AccessGuard>
          </div>
        </div>

        <div>
          <div className="border-t border-white/10 pt-4 mb-4">
            <SidebarLink link={{ label: user?.fullName || user?.username || 'User', href: "#", icon: (<div className="h-7 w-7 shrink-0 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm font-semibold">{user?.firstName?.[0] || user?.username?.[0] || '?'}</div>) }} />
            {open && (<div className="ml-9 mt-1 text-xs text-neutral-400"><div>{user?.email}</div><span className={cn("inline-block px-2 py-0.5 rounded text-xs font-semibold mt-1", user?.role?.toLowerCase() === 'admin' ? 'bg-red-500/20 text-red-300' : user?.role?.toLowerCase() === 'manager' ? 'bg-orange-500/20 text-orange-300' : 'bg-green-500/20 text-green-300')}>{user?.role || 'Staff'}</span></div>)}
          </div>
          <button onClick={handleLogout} className={cn("w-full flex items-center gap-2 px-3 py-2 rounded-lg", "bg-red-500/10 border border-red-500/30 text-red-300", "hover:bg-red-500/20 hover:border-red-500/50 hover:text-red-200", "transition-all duration-200")}>
            <IconLogout className="h-5 w-5 shrink-0" />
            {open && <span className="text-sm font-medium">Sign Out</span>}
          </button>
        </div>
      </SidebarBody>
    </SidebarContainer>
  );
}

const CustomSidebarLink = ({ link }: { link: { label: string; href: string; icon: React.ReactNode } }) => {
  return (<NavLink to={link.href}>{({ isActive }) => (<div className={cn("flex items-center gap-2 py-2 px-3 rounded-lg transition-all duration-200", isActive ? "bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-500/50" : "text-neutral-300 hover:bg-white/5 hover:text-white")}>{link.icon}<span className="text-sm font-medium whitespace-pre">{link.label}</span></div>)}</NavLink>);
};

const Logo = () => {
  return (<a href="#" className="relative z-20 flex items-center space-x-2 py-1 text-sm font-normal"><div className="h-8 w-8 shrink-0 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg"></div><motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="font-semibold text-xl whitespace-pre bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">OptiPlatform</motion.span></a>);
};

const LogoIcon = () => {
  return (<a href="#" className="relative z-20 flex items-center space-x-2 py-1"><div className="h-8 w-8 shrink-0 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg"></div></a>);
};
