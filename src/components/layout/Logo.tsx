import React from 'react';
import { Brain } from 'lucide-react';

const Logo: React.FC = () => {
  return (
    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary-500 text-white">
      <Brain size={20} />
    </div>
  );
};

export default Logo;