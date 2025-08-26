'use client';

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
} from 'chart.js';
import { Bar, Pie, Line, Doughnut } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement
);

interface ChartViewProps {
  json: any;
}

type ChartType = 'bar' | 'pie' | 'line' | 'doughnut';
type DataMode = 'types' | 'array' | 'object' | 'custom';

const ChartView: React.FC<ChartViewProps> = ({ json }) => {
  const { t } = useTranslation();
  const [mounted, setMounted] = useState(false);
  const [leftChartType, setLeftChartType] = useState<ChartType>('bar');
  const [rightChartType, setRightChartType] = useState<ChartType>('pie');
  const [leftDataMode, setLeftDataMode] = useState<DataMode>('types');
  const [rightDataMode, setRightDataMode] = useState<DataMode>('types');
  const [leftDataPath, setLeftDataPath] = useState<string>('');
  const [rightDataPath, setRightDataPath] = useState<string>('');
  const [availablePaths, setAvailablePaths] = useState<string[]>([]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (json) {
      const paths = extractDataPaths(json);
      setAvailablePaths(paths);
      if (paths.length > 0 && !leftDataPath) {
        setLeftDataPath(paths[0]);
      }
      if (paths.length > 0 && !rightDataPath) {
        setRightDataPath(paths[0]);
      }
    }
  }, [json]);

  const extractDataPaths = (obj: any, prefix = ''): string[] => {
    const paths: string[] = [];
    
    const traverse = (current: any, path: string) => {
      if (Array.isArray(current) && current.length > 0) {
        paths.push(path || 'root');
        if (typeof current[0] === 'object' && current[0] !== null) {
          const keys = Object.keys(current[0]);
          keys.forEach(key => {
            const newPath = path ? `${path}[].${key}` : key;
            traverse(current[0][key], newPath);
          });
        }
      } else if (current && typeof current === 'object') {
        Object.keys(current).forEach(key => {
          const newPath = path ? `${path}.${key}` : key;
          traverse(current[key], newPath);
        });
      }
    };
    
    traverse(obj, prefix);
    return paths.filter((path, index, self) => self.indexOf(path) === index);
  };

  const getDataAtPath = (obj: any, path: string): any => {
    if (!path || path === 'root') return obj;
    
    const parts = path.split(/\.|\[\]/);
    let current = obj;
    
    for (const part of parts) {
      if (part === '' || part === 'root') continue;
      if (Array.isArray(current)) {
        return current;
      }
      current = current?.[part];
      if (current === undefined) break;
    }
    
    return current;
  };

  const generateTypeCountData = (data: any) => {
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

    analyzeTypes(data);

    return {
      labels: Object.keys(typeCount).filter(k => typeCount[k] > 0),
      datasets: [
        {
          label: mounted ? t('chart.dataTypes') || 'Data Types' : 'Data Types',
          data: Object.values(typeCount).filter(v => v > 0),
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

  const generateArrayData = (data: any, dataPath: string) => {
    const selectedData = getDataAtPath(data, dataPath);
    
    if (!Array.isArray(selectedData) || selectedData.length === 0) {
      return generateTypeCountData(data);
    }

    if (typeof selectedData[0] === 'object' && selectedData[0] !== null) {
      const keys = Object.keys(selectedData[0]);
      const numericKeys = keys.filter(key => 
        selectedData.every(item => typeof item[key] === 'number')
      );
      const labelKey = keys.find(key => 
        selectedData.every(item => typeof item[key] === 'string')
      ) || keys[0];

      if (numericKeys.length > 0) {
        return {
          labels: selectedData.map(item => item[labelKey] || 'Item'),
          datasets: numericKeys.map((key, index) => ({
            label: key,
            data: selectedData.map(item => item[key]),
            backgroundColor: `rgba(${54 + index * 40}, ${162 - index * 20}, ${235 - index * 30}, 0.6)`,
            borderColor: `rgba(${54 + index * 40}, ${162 - index * 20}, ${235 - index * 30}, 1)`,
            borderWidth: 1,
          })),
        };
      }
    }

    return {
      labels: selectedData.map((_, index) => `Item ${index + 1}`),
      datasets: [{
        label: 'Values',
        data: selectedData.map(item => 
          typeof item === 'number' ? item : 1
        ),
        backgroundColor: 'rgba(54, 162, 235, 0.6)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 1,
      }],
    };
  };

  const generateObjectData = (data: any, dataPath: string) => {
    const selectedData = getDataAtPath(data, dataPath);
    
    if (!selectedData || typeof selectedData !== 'object' || Array.isArray(selectedData)) {
      return generateTypeCountData(data);
    }

    const entries = Object.entries(selectedData);
    const numericEntries = entries.filter(([_, value]) => typeof value === 'number');
    
    if (numericEntries.length > 0) {
      return {
        labels: numericEntries.map(([key]) => key),
        datasets: [{
          label: 'Values',
          data: numericEntries.map(([_, value]) => value as number),
          backgroundColor: [
            'rgba(255, 99, 132, 0.6)',
            'rgba(54, 162, 235, 0.6)',
            'rgba(255, 206, 86, 0.6)',
            'rgba(75, 192, 192, 0.6)',
            'rgba(153, 102, 255, 0.6)',
            'rgba(255, 159, 64, 0.6)',
          ],
          borderColor: [
            'rgba(255, 99, 132, 1)',
            'rgba(54, 162, 235, 1)',
            'rgba(255, 206, 86, 1)',
            'rgba(75, 192, 192, 1)',
            'rgba(153, 102, 255, 1)',
            'rgba(255, 159, 64, 1)',
          ],
          borderWidth: 1,
        }],
      };
    }

    const valueCounts: Record<string, number> = {};
    entries.forEach(([_, value]) => {
      const key = String(value);
      valueCounts[key] = (valueCounts[key] || 0) + 1;
    });

    return {
      labels: Object.keys(valueCounts),
      datasets: [{
        label: 'Value Counts',
        data: Object.values(valueCounts),
        backgroundColor: [
          'rgba(255, 99, 132, 0.6)',
          'rgba(54, 162, 235, 0.6)',
          'rgba(255, 206, 86, 0.6)',
          'rgba(75, 192, 192, 0.6)',
          'rgba(153, 102, 255, 0.6)',
        ],
        borderColor: [
          'rgba(255, 99, 132, 1)',
          'rgba(54, 162, 235, 1)',
          'rgba(255, 206, 86, 1)',
          'rgba(75, 192, 192, 1)',
          'rgba(153, 102, 255, 1)',
        ],
        borderWidth: 1,
      }],
    };
  };

  const generateChartData = (dataMode: DataMode, dataPath: string) => {
    if (!json || typeof json !== 'object') return null;

    switch (dataMode) {
      case 'types':
        return generateTypeCountData(json);
      case 'array':
        return generateArrayData(json, dataPath);
      case 'object':
        return generateObjectData(json, dataPath);
      case 'custom':
        const customData = getDataAtPath(json, dataPath);
        if (Array.isArray(customData)) {
          return generateArrayData(json, dataPath);
        } else if (customData && typeof customData === 'object') {
          return generateObjectData(json, dataPath);
        }
        return generateTypeCountData(customData || json);
      default:
        return generateTypeCountData(json);
    }
  };

  const renderChart = (type: ChartType, data: any) => {
    const options = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: type === 'pie' || type === 'doughnut',
        },
      },
    };

    switch (type) {
      case 'bar':
        return <Bar data={data} options={options} />;
      case 'pie':
        return <Pie data={data} options={options} />;
      case 'line':
        return <Line data={data} options={options} />;
      case 'doughnut':
        return <Doughnut data={data} options={options} />;
      default:
        return <Bar data={data} options={options} />;
    }
  };

  const leftChartData = generateChartData(leftDataMode, leftDataPath);
  const rightChartData = generateChartData(rightDataMode, rightDataPath);

  if (!leftChartData && !rightChartData) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-[var(--text-secondary)]">{mounted ? t('chart.noData') : 'No data available for charts'}</p>
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto p-6">
      <h2 className="text-xl font-bold mb-6">{mounted ? t('chart.title') || 'Data Visualization' : 'Data Visualization'}</h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-[var(--bg-secondary)] rounded-lg p-4 border border-[var(--border-color)]">
          <div className="flex flex-col space-y-3 mb-4">
            <div className="flex gap-2">
              <select
                value={leftChartType}
                onChange={(e) => setLeftChartType(e.target.value as ChartType)}
                className="flex-1 px-3 py-2 rounded-md border border-[var(--border-color)] bg-[var(--input-bg)] text-[var(--text-primary)] text-sm"
              >
                <option value="bar">{mounted ? t('chart.barChart') || 'Bar Chart' : 'Bar Chart'}</option>
                <option value="pie">{mounted ? t('chart.pieChart') || 'Pie Chart' : 'Pie Chart'}</option>
                <option value="line">{mounted ? t('chart.lineChart') || 'Line Chart' : 'Line Chart'}</option>
                <option value="doughnut">{mounted ? t('chart.doughnutChart') || 'Doughnut Chart' : 'Doughnut Chart'}</option>
              </select>
              
              <select
                value={leftDataMode}
                onChange={(e) => setLeftDataMode(e.target.value as DataMode)}
                className="flex-1 px-3 py-2 rounded-md border border-[var(--border-color)] bg-[var(--input-bg)] text-[var(--text-primary)] text-sm"
              >
                <option value="types">{mounted ? t('chart.dataTypes') || 'Data Types' : 'Data Types'}</option>
                <option value="array">{mounted ? t('chart.arrayData') || 'Array Data' : 'Array Data'}</option>
                <option value="object">{mounted ? t('chart.objectData') || 'Object Data' : 'Object Data'}</option>
                <option value="custom">{mounted ? t('chart.customPath') || 'Custom Path' : 'Custom Path'}</option>
              </select>
            </div>
            
            {leftDataMode === 'custom' && availablePaths.length > 0 && (
              <select
                value={leftDataPath}
                onChange={(e) => setLeftDataPath(e.target.value)}
                className="w-full px-3 py-2 rounded-md border border-[var(--border-color)] bg-[var(--input-bg)] text-[var(--text-primary)] text-sm"
              >
                <option value="">{mounted ? t('chart.selectPath') || 'Select data path...' : 'Select data path...'}</option>
                {availablePaths.map(path => (
                  <option key={path} value={path}>{path}</option>
                ))}
              </select>
            )}
          </div>
          
          <div className="h-[300px]">
            {leftChartData && renderChart(leftChartType, leftChartData)}
          </div>
        </div>
        
        <div className="bg-[var(--bg-secondary)] rounded-lg p-4 border border-[var(--border-color)]">
          <div className="flex flex-col space-y-3 mb-4">
            <div className="flex gap-2">
              <select
                value={rightChartType}
                onChange={(e) => setRightChartType(e.target.value as ChartType)}
                className="flex-1 px-3 py-2 rounded-md border border-[var(--border-color)] bg-[var(--input-bg)] text-[var(--text-primary)] text-sm"
              >
                <option value="bar">{mounted ? t('chart.barChart') || 'Bar Chart' : 'Bar Chart'}</option>
                <option value="pie">{mounted ? t('chart.pieChart') || 'Pie Chart' : 'Pie Chart'}</option>
                <option value="line">{mounted ? t('chart.lineChart') || 'Line Chart' : 'Line Chart'}</option>
                <option value="doughnut">{mounted ? t('chart.doughnutChart') || 'Doughnut Chart' : 'Doughnut Chart'}</option>
              </select>
              
              <select
                value={rightDataMode}
                onChange={(e) => setRightDataMode(e.target.value as DataMode)}
                className="flex-1 px-3 py-2 rounded-md border border-[var(--border-color)] bg-[var(--input-bg)] text-[var(--text-primary)] text-sm"
              >
                <option value="types">{mounted ? t('chart.dataTypes') || 'Data Types' : 'Data Types'}</option>
                <option value="array">{mounted ? t('chart.arrayData') || 'Array Data' : 'Array Data'}</option>
                <option value="object">{mounted ? t('chart.objectData') || 'Object Data' : 'Object Data'}</option>
                <option value="custom">{mounted ? t('chart.customPath') || 'Custom Path' : 'Custom Path'}</option>
              </select>
            </div>
            
            {rightDataMode === 'custom' && availablePaths.length > 0 && (
              <select
                value={rightDataPath}
                onChange={(e) => setRightDataPath(e.target.value)}
                className="w-full px-3 py-2 rounded-md border border-[var(--border-color)] bg-[var(--input-bg)] text-[var(--text-primary)] text-sm"
              >
                <option value="">{mounted ? t('chart.selectPath') || 'Select data path...' : 'Select data path...'}</option>
                {availablePaths.map(path => (
                  <option key={path} value={path}>{path}</option>
                ))}
              </select>
            )}
          </div>
          
          <div className="h-[300px]">
            {rightChartData && renderChart(rightChartType, rightChartData)}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChartView;