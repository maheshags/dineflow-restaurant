import { Bell, Search } from 'lucide-react';

interface TopNavbarProps {
  title: string;
  subtitle?: string;
}

export function TopNavbar({ title, subtitle }: TopNavbarProps) {
  return (
    <header className="h-16 bg-card border-b border-border flex items-center justify-between px-6 sticky top-0 z-20">
      <div>
        <h1 className="text-xl font-display font-bold text-foreground">{title}</h1>
        {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-4">
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search..."
            className="h-9 w-56 rounded-lg border border-input bg-background pl-9 pr-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/30 transition"
          />
        </div>
        <button className="relative w-9 h-9 rounded-lg border border-input bg-background flex items-center justify-center hover:bg-accent transition-colors">
          <Bell className="w-4 h-4 text-muted-foreground" />
          <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center">3</span>
        </button>
        <div className="w-9 h-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm cursor-pointer">
          RK
        </div>
      </div>
    </header>
  );
}
