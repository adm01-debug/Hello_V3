 import { useSortable } from '@dnd-kit/sortable';
 import { CSS } from '@dnd-kit/utilities';
 import { GropIcon as DragHandle, X, Eye, EyeOff } from 'lucide-react';
 import { Button } from '@/components/ui/button';
 import { cn } from '@/lib/utils';
 
 interface SortableWidgetProps {
   id: string;
   children: React.ReactNode;
   isEditing: boolean;
   onRemove?: () => void;
   className?: string;
 }
 
 export function SortableWidget({ id, children, isEditing, onRemove, className }: SortableWidgetProps) {
   const {
     attributes,
     listeners,
     setNodeRef,
     transform,
     transition,
     isDragging,
   } = useSortable({ id });
 
   const style = {
     transform: CSS.Transform.toString(transform),
     transition,
   };
 
   return (
     <div
       ref={setNodeRef}
       style={style}
       className={cn(
         "relative transition-all duration-200",
         isDragging && "z-50 opacity-50 scale-[1.02]",
         isEditing && "ring-2 ring-primary/20 rounded-xl p-1",
         className
       )}
     >
       {isEditing && (
         <div className="absolute -top-3 -right-3 z-10 flex gap-1">
           <Button
             variant="secondary"
             size="icon"
             className="h-8 w-8 rounded-full shadow-lg border border-border/50 cursor-grab active:cursor-grabbing"
             {...attributes}
             {...listeners}
           >
             <DragHandle className="h-4 w-4" />
           </Button>
           <Button
             variant="destructive"
             size="icon"
             className="h-8 w-8 rounded-full shadow-lg border border-destructive/20"
             onClick={onRemove}
           >
             <X className="h-4 w-4" />
           </Button>
         </div>
       )}
       <div className={cn(isEditing && "pointer-events-none opacity-80")}>
         {children}
       </div>
     </div>
   );
 }