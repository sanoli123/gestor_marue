import React from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactElement;
  valueClassName?: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, valueClassName }) => {
  return (
    <div className="bg-lino p-6 rounded-xl shadow-lg flex items-center space-x-4 transition-transform hover:scale-105 duration-300">
      <div className="text-oliva bg-crema p-3 rounded-full">
        {icon}
      </div>
      <div>
        <p className="text-sm font-medium text-oliva">{title}</p>
        <p className={`text-2xl font-bold ${valueClassName || 'text-espresso'}`}>{value}</p>
      </div>
    </div>
  );
};

export default StatCard;