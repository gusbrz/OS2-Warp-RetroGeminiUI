
import React from 'react';

interface DesktopIconProps {
  icon: React.ReactNode;
  label: string;
  onDoubleClick: () => void;
}

const DesktopIcon: React.FC<DesktopIconProps> = ({ icon, label, onDoubleClick }) => {
  return (
    <div 
      className="flex flex-col items-center justify-center w-24 h-24 text-center cursor-pointer group"
      onDoubleClick={onDoubleClick}
    >
      <div className="p-2">{icon}</div>
      <span className="text-white text-sm mt-1 px-1 group-hover:bg-blue-800 group-hover:text-white select-none">
        {label}
      </span>
    </div>
  );
};

export default DesktopIcon;
