import {
  Building2,
  Briefcase,
  Flame,
  GitCompare,
  UserCircle,
  RefreshCcw,
  FolderOpen,
  LogOut,
} from "lucide-react";
import React from 'react';
import classNames from 'classnames';

import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

import Logo from '../../assets/logo.png';
import { Icon } from '@iconify-icon/react';

export default function DashboardSidebar({ repoId, user }) {
   const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const [active, setActive] = useState("personal-branding");


  useEffect(() => {
  if (location.pathname.includes("/onboarding")) setActive("onboarding");
  else if (location.pathname.includes("/docs")) setActive("architecture");
  else if (location.pathname.includes("/hotspots")) setActive("hotspots");
  else if (location.pathname.includes("/commits")) setActive("changes");
  else if (location.pathname.includes("/personal-branding")) setActive("personal-branding");
  else setActive("personal-branding");
}, [location.pathname]);


  const handleLogout = async () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  };
   const handleRefresh = async () => {
    if (!user || !repoId) return;
    await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/repo/scan`, {
      repoUrl: `https://github.com/${repoId}`, 
      repoId,
      userId: user.id,
    });
    alert('Repo scan triggered!');
  };
  const menu = [
    {
      id: "personal-branding",
      label: "Dashboard",
      icon: <Icon icon="mage:dashboard-4" width="22" height="22" />,
      onClick: () =>
        navigate(`/personal-branding/${encodeURIComponent(repoId)}`, {
          state: { user },
        }),
    },
    {
      id: "onboarding",
      label: "Onboarding",
      icon: <Icon icon="solar:suitcase-bold" width="22" height="22" />,
      onClick: () =>
        navigate(`/onboarding/${encodeURIComponent(repoId)}`, {
          state: { user },
        }),
    },
    {
      id: "architecture",
      label: "Architecture",
      icon: <Icon icon="fluent:flowchart-16-regular" width="22" height="22" />,
      onClick: () => navigate(`/docs/${encodeURIComponent(repoId)}`, {
        state: { user },
      }),
    },
    {
      id: "hotspots",
      label: "Hotspots",
      icon: <Icon icon="ph:fire-duotone" width="22" height="22" />,
       onClick: () =>
        navigate(`/hotspots/${encodeURIComponent(repoId)}`, {
          state: { user },
        }),
    },
    {
      id: "changes",
      label: "Changes",
      icon: <Icon icon="tabler:status-change" width="22" height="22" />,
      onClick: () =>
        navigate(`/commits/${encodeURIComponent(repoId)}`, {
          state: { user },
        }),
    },
    
    
  ];

  return (
    <aside
  className={classNames(
    "h-screen bg-[#21262D] text-white py-8 shadow-lg flex-shrink-0 flex flex-col justify-between transition-all duration-300 border-r border-[#3A3838]",
    collapsed ? "w-20 px-2" : "w-64 px-2"
  )}
>
  <div>
    <div
  className={classNames(
    "flex items-center mb-10 px-2 ",
    collapsed ? "justify-center" : "justify-between"
  )}
>
  {!collapsed ? (
    <p className="text-2xl font-medium tracking-wide text-left flex items-center">
      <img src={Logo} alt="Logo" className="w-7 h-7 mr-3" />
      <div>
        <p className="text-base font-medium">
          <span className="bg-gradient-to-r from-[#CAF5BB] to-[#2F89FF] bg-clip-text text-transparent sub-head">
            axon
          </span>
        </p>
        <p className="text-xs text-[#C9C9C9]">Your repo with AI clarity</p>
      </div>
    </p>
  ) : (
    <img src={Logo} alt="Logo" className="w-8 h-8" />
  )}
</div>


    {/* Menu Items */}
    <div
  className={classNames(
    "flex flex-col space-y-2",
    collapsed ? "items-center" : "items-start"
  )}
>
  {menu.map(({ id, label, icon, onClick, disabled }) => (
    <button
      key={id}
      onClick={onClick}
      disabled={disabled}
      className={classNames(
        "transition",
        {
          "opacity-30 cursor-not-allowed": disabled,
          "text-white bg-[#2F89FF]": active === id, 
          "text-white hover:bg-white/10": active !== id,
          // Styling when collapsed (perfect circle centered)
          "justify-center items-center rounded-full h-10 w-10": collapsed,
          // Styling when expanded
          "flex items-center py-2 rounded-xl w-full px-4": !collapsed,
        }
      )}
    >
      <span className="flex items-center justify-center">
        {React.cloneElement(icon, {
          className: `w-6 h-6 ${active === id ? "text-white" : "text-white"}`,
        })}
        {!collapsed && (
          <span className={`ml-2 text-xs ${active === id ? "font-semibold" : ""}`}>
            {label}
          </span>
        )}
      </span>
    </button>
  ))}
</div>

  </div>

  {/* Bottom Section: Action Buttons + Collapse Toggle */}
  <div className="flex flex-col items-center space-y-4">
      <button onClick={() => window.open("http://localhost:8080", "_blank")}
  className={classNames(
    "transition rounded-xl w-full",
    {
      "flex items-center px-4 py-4 bg-[#292E37] border border-[#313843]": !collapsed,
      "flex justify-center items-center w-12 h-12 bg-[transparent] border-none": collapsed,
    }
  )}
>
  {collapsed ? (
    <div className="w-10 h-10 rounded-full bg-[#2E343B] flex items-center justify-center">
      <Icon
        icon="solar:chat-round-call-line-duotone"
        width="24"
        height="24"
        className="text-[#799AD6]"
      />
    </div>
  ) : (
    <div className="flex items-center space-x-3">
      <div className="w-10 h-10 rounded-full bg-[#21262D] flex items-center justify-center">
        <Icon
          icon="solar:chat-round-call-line-duotone"
          width="24"
          height="24"
          className="text-[#799AD6]"
        />
      </div>
      <div className="flex flex-col text-left">
        <span className="text-white font-semibold text-xs leading-tight">
          AI Powered Pairing
        </span>
        <span className="text-white/60 text-xs">Enter here</span>
      </div>
    </div>
  )}
</button>




   <button
  onClick={() => navigate("/selectrepo")}
  className={classNames(
    "text-xs flex items-center text-[#CAF5BB] transition gap-3 ",
    {
      // Collapsed: icon in circular blue background
      "w-10 h-10 rounded-full justify-center bg-[#CAF5BB]/15": collapsed,
      // Expanded: full-width button with text
      "px-4 py-3 rounded-xl bg-[#CAF5BB]/15 hover:bg-[#37BD6B]/25 flex items-center py-2 rounded-xl w-full px-4": !collapsed,
    }
  )}
>
   <RefreshCcw className={classNames("w-5 h-5", { "mr-2": !collapsed })} />
  {!collapsed && "Switch Repository"}
</button>


    {/* Collapse Toggle Button */}
    <button
      onClick={() => setCollapsed(!collapsed)}
      className={classNames(
        "text-[#9CA0B2] text-sm flex items-center justify-left mt-8 ",
        collapsed ? "w-full justify-center" : "w-full justify-start"
      )}
    >
      {collapsed ? (
        <span><Icon icon="tabler:layout-sidebar-right-collapse-filled" width="24" height="24" /></span>
      ) : (
        <>
          <span className="mr-2"><Icon icon="tabler:layout-sidebar-left-collapse-filled" width="22" height="22" /></span>
          <span className="text-[12px]">Collapse Menu</span>
        </>
      )}
    </button>
  </div>
</aside>

  );
}
