'use client';

import { ReactNode } from 'react';
import Navbar from '@/components/Navbar';
import { useTheme } from '@/hooks/useTheme';

interface ToolPageWrapperProps {
  children: ReactNode;
}

export default function ToolPageWrapper({ children }: ToolPageWrapperProps) {
  const { theme, toggleTheme } = useTheme();

  return (
    <>
      <Navbar theme={theme} onThemeToggle={toggleTheme} />
      {children}
    </>
  );
}
