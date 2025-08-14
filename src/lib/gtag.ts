export const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

// Check if Google Analytics is enabled
export const isGAEnabled = Boolean(GA_MEASUREMENT_ID);

// Log page views
export const pageview = (url: string) => {
  if (!isGAEnabled || typeof window === 'undefined') return;
  
  (window as any).gtag('config', GA_MEASUREMENT_ID, {
    page_path: url,
  });
};

// Log specific events
export const event = ({
  action,
  category,
  label,
  value,
}: {
  action: string;
  category: string;
  label?: string;
  value?: number;
}) => {
  if (!isGAEnabled || typeof window === 'undefined') return;
  
  (window as any).gtag('event', action, {
    event_category: category,
    event_label: label,
    value: value,
  });
};

// Specific event tracking functions for JSON operations
export const trackJsonFormat = () => {
  event({
    action: 'format',
    category: 'json_operations',
    label: 'format_json',
  });
};

export const trackJsonCompact = () => {
  event({
    action: 'compact',
    category: 'json_operations',
    label: 'compact_json',
  });
};

export const trackJsonClear = () => {
  event({
    action: 'clear',
    category: 'json_operations',
    label: 'clear_json',
  });
};

export const trackJsonCopy = () => {
  event({
    action: 'copy',
    category: 'json_operations',
    label: 'copy_json',
  });
};

export const trackJsonPaste = () => {
  event({
    action: 'paste',
    category: 'json_operations',
    label: 'paste_json',
  });
};

export const trackTabSwitch = (tabName: string) => {
  event({
    action: 'switch_tab',
    category: 'navigation',
    label: tabName,
  });
};

export const trackExampleUsed = (exampleName: string) => {
  event({
    action: 'use_example',
    category: 'json_operations',
    label: exampleName,
  });
};