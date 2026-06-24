import { Link, useRouterState } from "@tanstack/react-router";
import { BarChart3, ListTree, Settings } from "lucide-react";
import type { ReactNode } from "react";

type AppFrameProps = {
  sidebar: ReactNode;
  children: ReactNode;
};

const tabs = [
  {
    label: "Trace",
    to: "/",
    icon: ListTree,
    isActive: (pathname: string) => pathname === "/" || pathname.startsWith("/sessions/"),
  },
  {
    label: "用量",
    to: "/usage",
    icon: BarChart3,
    isActive: (pathname: string) => pathname === "/usage",
  },
  {
    label: "配置",
    to: "/setup",
    icon: Settings,
    isActive: (pathname: string) => pathname === "/setup",
  },
] as const;

export function AppFrame({ sidebar, children }: AppFrameProps) {
  const pathname = useRouterState({ select: (state) => state.location.pathname });

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="grid min-h-screen lg:h-screen lg:grid-cols-[22rem_minmax(0,1fr)]">
        <aside className="flex min-h-0 flex-col border-b border-border bg-surface lg:border-b-0 lg:border-r">
          <div className="border-b border-border px-5 py-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h1 className="text-xl font-semibold tracking-normal">Pig</h1>
                <p className="mt-1 text-sm text-muted">Pi flight recorder</p>
              </div>
            </div>

            <nav className="mt-4 grid grid-cols-3 gap-1 rounded-md border border-border bg-surface-muted p-1">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const active = tab.isActive(pathname);

                return (
                  <Link
                    key={tab.to}
                    to={tab.to}
                    className={`inline-flex min-h-9 items-center justify-center gap-1.5 rounded px-2 text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-inset focus:ring-foreground/20 ${
                      active
                        ? "bg-surface text-foreground shadow-sm"
                        : "text-muted hover:bg-surface-hover hover:text-foreground"
                    }`}
                  >
                    <Icon className="size-4" />
                    <span>{tab.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="min-h-0 flex-1 overflow-hidden">{sidebar}</div>
        </aside>

        <section className="min-h-0 min-w-0 overflow-auto bg-background">{children}</section>
      </div>
    </main>
  );
}
