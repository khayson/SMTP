import React from "react";

interface DeviceFrameProps {
  type: 'mobile' | 'tablet' | 'desktop';
  children: React.ReactNode;
}

export default function DeviceFrame({ type, children }: DeviceFrameProps) {
  if (type === 'desktop') {
    return (
      <div className="w-full flex-1 flex flex-col bg-white border border-[#E4E6EB] shadow-2xl rounded-2xl overflow-hidden animate-in zoom-in-95 duration-500">
        <div className="h-10 bg-[#F0F2F5] border-b border-[#E4E6EB] flex items-center px-4 shrink-0 justify-between">
           <div className="flex gap-2">
              <div className="w-3 h-3 rounded-full bg-[#FF5F57]" />
              <div className="w-3 h-3 rounded-full bg-[#FFBD2E]" />
              <div className="w-3 h-3 rounded-full bg-[#28C840]" />
           </div>
           <div className="bg-white px-6 py-1 rounded-md border border-[#E4E6EB] text-[10px] text-[#65676B] font-bold flex items-center gap-2 max-w-[400px] truncate">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              Secure Preview Engine
           </div>
           <div className="w-12" />
        </div>
        <div className="flex-1 min-h-0 bg-white overflow-hidden relative">
          {children}
        </div>
      </div>
    );
  }

  if (type === 'tablet') {
    return (
      <div className="mx-auto w-[768px] h-[900px] bg-[#050505] rounded-[3rem] p-6 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.3)] relative border-[3px] border-[#18181b] animate-in slide-in-from-bottom-8 duration-700">
        {/* Tablet Specifics */}
        <div className="absolute top-1/2 -left-[4px] -translate-y-12 w-[3px] h-12 bg-[#18181b] rounded-l-md" />
        <div className="absolute top-1/2 -left-[4px] -translate-y-24 w-[3px] h-12 bg-[#18181b] rounded-l-md" />
        
        <div className="w-full h-full bg-white rounded-[2rem] overflow-hidden relative">
           {children}
        </div>
        
        <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-32 h-1 bg-[#18181b] rounded-full opacity-40" />
      </div>
    );
  }

  // Mobile
  return (
    <div className="mx-auto w-[375px] h-[667px] bg-[#18181b] rounded-[4rem] p-4 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.4)] relative border-[4px] border-[#09090b] animate-in slide-in-from-bottom-12 duration-1000">
      {/* Notch */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-36 h-8 bg-[#09090b] rounded-b-3xl z-20 flex items-center justify-center gap-3">
         <div className="w-2 h-2 rounded-full bg-white/10" />
         <div className="w-10 h-1 bg-white/10 rounded-full" />
      </div>
      
      {/* Buttons */}
      <div className="absolute top-28 -left-[5px] w-[5px] h-12 bg-[#09090b] rounded-l-md" />
      <div className="absolute top-44 -left-[5px] w-[5px] h-12 bg-[#09090b] rounded-l-md" />
      <div className="absolute top-28 -right-[5px] w-[5px] h-16 bg-[#09090b] rounded-r-md" />

      <div className="w-full h-full bg-white rounded-[3rem] overflow-hidden relative">
         {children}
      </div>
      
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-24 h-1.5 bg-[#09090b] rounded-full opacity-60" />
    </div>
  );
}
