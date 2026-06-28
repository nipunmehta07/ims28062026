"use client";
import { useState } from "react";
import SlidePanel from "./SlidePanel";
import AddItemForm from "./forms/AddItemForm";
import NewOrderForm from "./forms/NewOrderForm";

// 1. Define the props so page.tsx can control the active tab
interface DashboardLayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export default function DashboardLayout({ children, activeTab, setActiveTab }: DashboardLayoutProps) {
  const [isPanelOpen, setIsPanelOpen] = useState(false);

  // Navigation menu items
  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: "❖" },
    { id: "inventory", label: "Inventory", icon: "▤" },
    { id: "bom", label: "Bill of Materials", icon: "⎈" },
    { id: "orders", label: "Order Book", icon: "📋" },
    { id: "inbound", label: "Inbound Stock", icon: "📥" },
  ];

  // Helper to determine what the top right button should say (and do)
  const getHeaderAction = () => {
    switch (activeTab) {
      case 'inventory': return '+ Add Item';
      case 'bom': return '+ New BOM';
      case 'orders': return '+ New Order';
      case 'inbound': return '+ Purchase Order';
      default: return null; // No button on the Dashboard tab
    }
  };

  const headerActionLabel = getHeaderAction();

  return (
    <div className="flex h-screen min-h-[640px] bg-[#f5f5f3] overflow-hidden font-sans">
      
      {/* --- SIDEBAR --- */}
      <aside className="w-[220px] min-w-[220px] bg-white border-r border-gray-200 flex flex-col z-10">
        <div className="p-5 border-b border-gray-200">
          <div className="text-[13px] font-medium tracking-wider text-gray-900">MANUF·OS</div>
          <div className="text-[11px] text-gray-500 mt-0.5">Inventory & BOM</div>
        </div>
        
        <nav className="p-2 flex-1 overflow-y-auto">
          <div className="text-[10px] tracking-widest text-gray-400 uppercase p-2 mt-2">Main</div>
          
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id);
                setIsPanelOpen(false); // Close panel if navigating away
              }}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-[13px] transition-all mb-0.5
                ${activeTab === item.id 
                  ? "bg-gray-900 text-white" 
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                }`}
            >
              <span className="opacity-75">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>
      </aside>

      {/* --- MAIN CONTENT AREA --- */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        
        {/* --- TOP HEADER --- */}
        <header className="h-[52px] bg-white border-b border-gray-200 px-6 flex items-center justify-between shrink-0 z-10 relative">
          <h1 className="text-[15px] font-medium capitalize">
            {activeTab ? activeTab.replace('-', ' ') : 'Dashboard'}
          </h1>
          
          <div className="flex items-center gap-3">
            {/* Search Bar */}
            <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-md px-3 py-1.5 transition-colors focus-within:border-gray-400 focus-within:bg-white">
              <span className="text-gray-400 text-sm">🔍</span>
              <input 
                type="text" 
                placeholder="Search..." 
                className="bg-transparent border-none outline-none text-[13px] w-[130px] text-gray-900 placeholder-gray-400" 
              />
            </div>
            
            {/* Dynamic Action Button */}
            {headerActionLabel && (
              <button 
                onClick={() => setIsPanelOpen(true)}
                className="px-4 py-1.5 bg-gray-900 text-white text-[13px] font-medium rounded-md hover:bg-gray-800 transition-colors shadow-sm"
              >
                {headerActionLabel}
              </button>
            )}
          </div>
        </header>

        {/* --- DYNAMIC PAGE CONTENT --- */}
        <div className="flex-1 overflow-y-auto p-6">
          {children}
        </div>

        {/* --- SLIDE OUT PANEL --- */}
        <SlidePanel 
          isOpen={isPanelOpen} 
          onClose={() => setIsPanelOpen(false)} 
          title={headerActionLabel ? headerActionLabel.replace('+ ', 'New ') : 'Details'}
        >
          {/* Conditionally render the correct form based on the active tab */}
          {activeTab === 'inventory' && (
  <AddItemForm 
    onCancel={() => setIsPanelOpen(false)} 
    onSuccess={() => {
      setIsPanelOpen(false); // Close the panel
      // Add any refresh logic here if needed
    }} 
  />
)}
          {activeTab === 'orders' && <NewOrderForm onCancel={() => setIsPanelOpen(false)} />}
          
          {/* Fallback for tabs that don't have forms built yet */}
          {(activeTab === 'bom' || activeTab === 'inbound') && (
            <div className="text-center mt-10">
              <p className="text-[13px] text-gray-500">The form for {activeTab} is under construction.</p>
              <button 
                onClick={() => setIsPanelOpen(false)}
                className="mt-4 px-4 py-2 bg-white border border-gray-200 rounded-md text-[13px]"
              >
                Close
              </button>
            </div>
          )}
        </SlidePanel>

      </main>
    </div>
  );
}