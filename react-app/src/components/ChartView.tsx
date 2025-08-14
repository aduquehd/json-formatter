'use client';

import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Bar, Pie } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

interface ChartViewProps {
  json: any;
}

const ChartView: React.FC<ChartViewProps> = ({ json }) => {
  const generateChartData = () => {
    if (!json || typeof json !== 'object') return null;

    const typeCount: Record<string, number> = {
      string: 0,
      number: 0,
      boolean: 0,
      null: 0,
      array: 0,
      object: 0,
    };

    const analyzeTypes = (obj: any) => {
      if (Array.isArray(obj)) {
        typeCount.array++;
        obj.forEach(analyzeTypes);
      } else if (obj === null) {
        typeCount.null++;
      } else if (typeof obj === 'object') {
        typeCount.object++;
        Object.values(obj).forEach(analyzeTypes);
      } else {
        typeCount[typeof obj]++;
      }
    };

    analyzeTypes(json);

    return {
      labels: Object.keys(typeCount),
      datasets: [
        {
          label: 'Data Types',
          data: Object.values(typeCount),
          backgroundColor: [
            'rgba(75, 192, 192, 0.6)',
            'rgba(54, 162, 235, 0.6)',
            'rgba(255, 206, 86, 0.6)',
            'rgba(153, 102, 255, 0.6)',
            'rgba(255, 99, 132, 0.6)',
            'rgba(255, 159, 64, 0.6)',
          ],
          borderColor: [
            'rgba(75, 192, 192, 1)',
            'rgba(54, 162, 235, 1)',
            'rgba(255, 206, 86, 1)',
            'rgba(153, 102, 255, 1)',
            'rgba(255, 99, 132, 1)',
            'rgba(255, 159, 64, 1)',
          ],
          borderWidth: 1,
        },
      ],
    };
  };

  const chartData = generateChartData();

  if (!chartData) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-[var(--text-secondary)]">No data available for charts</p>
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto p-6">
      <h2 className="text-xl font-bold mb-6">Data Visualization</h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-[var(--bg-secondary)] rounded-lg p-4 border border-[var(--border-color)]">
          <h3 className="text-lg font-semibold mb-4">Type Distribution (Bar)</h3>
          <Bar 
            data={chartData}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: {
                  display: false,
                },
              },
            }}
          />
        </div>
        
        <div className="bg-[var(--bg-secondary)] rounded-lg p-4 border border-[var(--border-color)]">
          <h3 className="text-lg font-semibold mb-4">Type Distribution (Pie)</h3>
          <Pie 
            data={chartData}
            options={{
              responsive: true,
              maintainAspectRatio: false,
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default ChartView;