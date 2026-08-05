/* eslint-disable react-refresh/only-export-components -- file intentionally exports variants/hooks alongside components; HMR-only rule */
import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { 
  Inbox, 
  Search, 
  AlertCircle, 
  CheckCircle2, 
  FileQuestion,
  Phone,
  Users,
  MessageSquare,
  Calendar,
  Bell,
  BarChart3,
  Settings,
  type LucideIcon
} from "lucide-react";

const emptyStateVariants = cva(
  "flex flex-col items-center justify-center text-center p-8 rounded-lg",
  {
    variants: {
      variant: {
        default: "bg-muted/30 border border-dashed border-border",
        search: "bg-muted/20",
        error: "bg-destructive/5 border border-dashed border-destructive/20",
        success: "bg-success/5 border border-dashed border-success/20",
        minimal: "",
        card: "bg-card border shadow-sm",
      },
      size: {
        sm: "p-4 gap-2",
        default: "p-8 gap-4",
        lg: "p-12 gap-6",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

const iconContainerVariants = cva(
  "flex items-center justify-center rounded-full",
  {
    variants: {
      variant: {
        default: "bg-muted text-muted-foreground",
        search: "bg-primary/10 text-primary",
        error: "bg-destructive/10 text-destructive",
        success: "bg-success/10 text-success",
        minimal: "text-muted-foreground",
        card: "bg-muted text-muted-foreground",
      },
      size: {
        sm: "h-10 w-10",
        default: "h-14 w-14",
        lg: "h-20 w-20",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

const iconSizeMap = {
  sm: "h-5 w-5",
  default: "h-7 w-7",
  lg: "h-10 w-10",
};

// Preset icons for common use cases
const presetIcons: Record<string, LucideIcon> = {
  default: Inbox,
  search: Search,
  error: AlertCircle,
  success: CheckCircle2,
  calls: Phone,
  contacts: Users,
  messages: MessageSquare,
  calendar: Calendar,
  notifications: Bell,
  analytics: BarChart3,
  chart: BarChart3,
  settings: Settings,
  unknown: FileQuestion,
};

export interface EmptyStateAction {
  label: string;
  onClick?: () => void;
  href?: string;
  variant?: "default" | "outline" | "secondary" | "ghost";
  icon?: React.ReactNode;
}

export interface EmptyStateProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof emptyStateVariants> {
  /** Custom icon to display */
  icon?: React.ReactNode;
  /** Preset icon type */
  iconType?: keyof typeof presetIcons;
  /** Main title */
  title: string;
  /** Description text */
  description?: string;
  /** Primary action button */
  action?: EmptyStateAction;
  /** Secondary action button */
  secondaryAction?: EmptyStateAction;
  /** Whether to show animation */
  animated?: boolean;
}

const EmptyState = React.forwardRef<HTMLDivElement, EmptyStateProps>(
  (
    {
      className,
      variant = "default",
      size = "default",
      icon,
      iconType,
      title,
      description,
      action,
      secondaryAction,
      animated = true,
      ...props
    },
    ref
  ) => {
    // Determine which icon to use
    const IconComponent = iconType 
      ? presetIcons[iconType] 
      : variant && presetIcons[variant as keyof typeof presetIcons]
        ? presetIcons[variant as keyof typeof presetIcons]
        : presetIcons.default;

    const iconSize = iconSizeMap[size || "default"];

    return (
      <div
        ref={ref}
        className={cn(
          emptyStateVariants({ variant, size }),
          animated && "animate-fade-in",
          className
        )}
        role="status"
        aria-label={title}
        {...props}
      >
        {/* Icon */}
        <div className={cn(iconContainerVariants({ variant, size }))}>
          {icon || <IconComponent className={iconSize} aria-hidden="true" />}
        </div>

        {/* Text Content */}
        <div className="space-y-1.5 max-w-sm">
          <h3 className={cn(
            "font-semibold text-foreground",
            size === "sm" && "text-sm",
            size === "default" && "text-base",
            size === "lg" && "text-lg"
          )}>
            {title}
          </h3>
          {description && (
            <p className={cn(
              "text-muted-foreground",
              size === "sm" && "text-xs",
              size === "default" && "text-sm",
              size === "lg" && "text-base"
            )}>
              {description}
            </p>
          )}
        </div>

        {/* Actions */}
        {(action || secondaryAction) && (
          <div className={cn(
            "flex items-center gap-3",
            size === "sm" && "mt-2",
            size === "default" && "mt-4",
            size === "lg" && "mt-6"
          )}>
            {action && (
              <Button
                variant={action.variant || "default"}
                size={size === "lg" ? "lg" : size === "sm" ? "sm" : "default"}
                onClick={action.onClick}
                asChild={!!action.href}
              >
                {action.href ? (
                  <a href={action.href}>
                    {action.icon}
                    {action.label}
                  </a>
                ) : (
                  <>
                    {action.icon}
                    {action.label}
                  </>
                )}
              </Button>
            )}
            {secondaryAction && (
              <Button
                variant={secondaryAction.variant || "outline"}
                size={size === "lg" ? "lg" : size === "sm" ? "sm" : "default"}
                onClick={secondaryAction.onClick}
                asChild={!!secondaryAction.href}
              >
                {secondaryAction.href ? (
                  <a href={secondaryAction.href}>
                    {secondaryAction.icon}
                    {secondaryAction.label}
                  </a>
                ) : (
                  <>
                    {secondaryAction.icon}
                    {secondaryAction.label}
                  </>
                )}
              </Button>
            )}
          </div>
        )}
      </div>
    );
  }
);
EmptyState.displayName = "EmptyState";

// Convenience components for common use cases
export function EmptySearchState({
  searchTerm,
  onClear,
  ...props
}: Omit<EmptyStateProps, "title" | "variant" | "iconType"> & {
  searchTerm?: string;
  onClear?: () => void;
}) {
  return (
    <EmptyState
      variant="search"
      iconType="search"
      title="Nenhum resultado encontrado"
      description={
        searchTerm
          ? `Não encontramos resultados para "${searchTerm}". Tente ajustar os filtros ou termos de busca.`
          : "Tente ajustar os filtros ou termos de busca."
      }
      action={onClear ? { label: "Limpar busca", onClick: onClear, variant: "outline" } : undefined}
      {...props}
    />
  );
}

export function EmptyErrorState({
  onRetry,
  ...props
}: Omit<EmptyStateProps, "title" | "variant" | "iconType"> & {
  onRetry?: () => void;
}) {
  return (
    <EmptyState
      variant="error"
      iconType="error"
      title="Erro ao carregar dados"
      description="Ocorreu um erro ao carregar as informações. Por favor, tente novamente."
      action={onRetry ? { label: "Tentar novamente", onClick: onRetry } : undefined}
      {...props}
    />
  );
}

export function EmptyCallsState(props: Omit<EmptyStateProps, "title" | "iconType">) {
  return (
    <EmptyState
      iconType="calls"
      title="Nenhuma chamada"
      description="Não há chamadas para exibir no momento."
      {...props}
    />
  );
}

export function EmptyContactsState({
  onAdd,
  ...props
}: Omit<EmptyStateProps, "title" | "iconType"> & {
  onAdd?: () => void;
}) {
  return (
    <EmptyState
      iconType="contacts"
      title="Nenhum contato"
      description="Sua lista de contatos está vazia. Adicione contatos para começar."
      action={onAdd ? { label: "Adicionar contato", onClick: onAdd } : undefined}
      {...props}
    />
  );
}

export function EmptyNotificationsState(props: Omit<EmptyStateProps, "title" | "iconType">) {
  return (
    <EmptyState
      iconType="notifications"
      title="Nenhuma notificação"
      description="Você está em dia! Não há notificações no momento."
      variant="minimal"
      size="sm"
      {...props}
    />
  );
}

export { EmptyState, emptyStateVariants };