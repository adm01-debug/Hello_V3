 import { useState, useEffect, useCallback } from 'react';
 
 export type WidgetId = 
   | 'stats' 
   | 'active-calls' 
   | 'call-volume' 
   | 'queue-status' 
   | 'callbacks' 
   | 'supervisor' 
   | 'recent-calls' 
   | 'agents-list';
 
 export interface WidgetLayout {
   id: WidgetId;
   visible: boolean;
 }
 
 const DEFAULT_LAYOUT: WidgetLayout[] = [
   { id: 'stats', visible: true },
   { id: 'active-calls', visible: true },
   { id: 'call-volume', visible: true },
   { id: 'queue-status', visible: true },
   { id: 'callbacks', visible: true },
   { id: 'supervisor', visible: true },
   { id: 'recent-calls', visible: true },
   { id: 'agents-list', visible: true },
 ];
 
 const STORAGE_KEY = 'voip-dashboard-layout';
 
 export function useDashboardLayout() {
   const [layout, setLayout] = useState<WidgetLayout[]>(() => {
     try {
       const saved = localStorage.getItem(STORAGE_KEY);
       if (!saved) return DEFAULT_LAYOUT;
       const parsed = JSON.parse(saved);
       return Array.isArray(parsed) ? parsed : DEFAULT_LAYOUT;
     } catch {
       return DEFAULT_LAYOUT;
     }
   });
   const [isEditing, setIsEditing] = useState(false);
 
   const saveLayout = useCallback((newLayout: WidgetLayout[]) => {
     setLayout(newLayout);
     localStorage.setItem(STORAGE_KEY, JSON.stringify(newLayout));
   }, []);
 
   const resetLayout = useCallback(() => {
     saveLayout(DEFAULT_LAYOUT);
   }, [saveLayout]);
 
   const toggleWidget = useCallback((id: WidgetId) => {
     const newLayout = layout.map(w => 
       w.id === id ? { ...w, visible: !w.visible } : w
     );
     saveLayout(newLayout);
   }, [layout, saveLayout]);
 
   return {
     layout,
     isEditing,
     setIsEditing,
     saveLayout,
     resetLayout,
     toggleWidget,
   };
 }