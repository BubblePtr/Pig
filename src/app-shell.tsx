import { useRouter, useRouterState } from "@tanstack/react-router";
import { AppLayout, Navbar, Sidebar } from "@heroui-pro/react";
import { BarChart3, Circle, GitBranch, ListTree, Settings } from "lucide-react";
import { useState, type CSSProperties, type ReactNode } from "react";

type AppFrameProps = {
  sidebar?: ReactNode;
  toolbarActions?: ReactNode;
  children: ReactNode;
};

const sidebarProject = {
  id: "pig",
  name: "Pig",
  route: "/projects/pig/sessions",
  sessions: [
    {
      id: "session-control-plane-shell",
      title: "Agent Workspace shell",
      updatedLabel: "Active now",
      active: true,
      unread: false,
    },
    {
      id: "session-analyze-boundary",
      title: "Analyze boundary pass",
      updatedLabel: "12 min ago",
      active: false,
      unread: true,
    },
    {
      id: "session-usage-review",
      title: "Usage evidence review",
      updatedLabel: "Yesterday",
      active: false,
      unread: false,
    },
  ],
};

const analyzeNavigationItems = [
  {
    label: "Trace",
    to: "/",
    icon: ListTree,
    isActive: (pathname: string) => pathname === "/" || pathname.startsWith("/sessions/"),
  },
  {
    label: "Usage",
    to: "/usage",
    icon: BarChart3,
    isActive: (pathname: string) => pathname === "/usage",
  },
] as const;

const systemNavigationItems = [
  {
    label: "Settings",
    to: "/setup",
    icon: Settings,
    isActive: (pathname: string) => pathname === "/setup",
  },
] as const;

const sidebarDefaultSize = "18rem";
const sidebarMinSize = "16rem";
const sidebarMaxSize = "24rem";
const sidebarStyle = {
  "--sidebar-width": sidebarDefaultSize,
} as CSSProperties;

const titlebarHeight = "40px";
const titlebarControlStyle = {
  width: "28px",
  height: "28px",
} as CSSProperties;
const trafficWidth = "88px";
const titlebarGap = "16px";

function getActiveTab(pathname: string) {
  if (pathname.startsWith("/projects/")) {
    return "Sessions";
  }

  if (pathname === "/" || pathname.startsWith("/sessions/") || pathname === "/usage") {
    return "Analyze";
  }

  return "Settings";
}

function SidebarSessionGlyph({
  active,
  unread,
}: {
  active: boolean;
  unread: boolean;
}) {
  if (active || unread) {
    return (
      <GitBranch
        aria-label={active ? "Active session" : "Unread result"}
        className={`size-4 ${active ? "text-primary" : "text-muted"}`}
      />
    );
  }

  return <Circle aria-hidden="true" className="size-2 fill-muted text-muted" />;
}

function ProjectNavigation({ pathname }: { pathname: string }) {
  const projectActive = pathname.startsWith("/projects/");

  return (
    <Sidebar.Group data-testid="sidebar-projects">
      <Sidebar.GroupLabel className="px-3 text-sm normal-case">
        {sidebarProject.name}
      </Sidebar.GroupLabel>
      <Sidebar.Menu aria-label="Pig project sessions" showGuideLines={false}>
        {sidebarProject.sessions.map((session) => (
          <Sidebar.MenuItem
            key={session.id}
            href={sidebarProject.route}
            id={session.id}
            isCurrent={projectActive && session.active}
            textValue={session.title}
          >
            <Sidebar.MenuIcon className="justify-center">
              <SidebarSessionGlyph active={session.active} unread={session.unread} />
            </Sidebar.MenuIcon>
            <Sidebar.MenuLabel className="min-w-0">
              <span className="block truncate">{session.title}</span>
            </Sidebar.MenuLabel>
            <Sidebar.MenuActions className="ml-auto text-xs tabular-nums text-muted">
              {session.updatedLabel}
            </Sidebar.MenuActions>
          </Sidebar.MenuItem>
        ))}
      </Sidebar.Menu>
    </Sidebar.Group>
  );
}

function WorkspaceNavigation({ pathname }: { pathname: string }) {
  return (
    <Sidebar.Group
      className="min-h-0 flex-1 overflow-y-auto"
      data-testid="sidebar-workspace"
    >
      <Sidebar.GroupLabel className="px-3 text-sm normal-case">
        Workspace
      </Sidebar.GroupLabel>
      <ProjectNavigation pathname={pathname} />
    </Sidebar.Group>
  );
}

function AnalyzeNavigation({ pathname }: { pathname: string }) {
  const analyzeActive =
    pathname === "/" || pathname.startsWith("/sessions/") || pathname === "/usage";

  return (
    <Sidebar.Group>
      <Sidebar.Menu
        aria-label="Analyze navigation"
        defaultExpandedKeys={["Analyze"]}
        showGuideLines
      >
        <Sidebar.MenuItem
          id="Analyze"
          isCurrent={analyzeActive}
          textValue="Analyze"
        >
          <Sidebar.MenuItemContent className="min-w-0 flex-1">
            {null}
          </Sidebar.MenuItemContent>
          <Sidebar.MenuIcon>
            <BarChart3 className="size-4" />
          </Sidebar.MenuIcon>
          <Sidebar.MenuLabel>
            Analyze
          </Sidebar.MenuLabel>
          <Sidebar.MenuTrigger>
            <Sidebar.MenuIndicator />
          </Sidebar.MenuTrigger>
          <Sidebar.Submenu>
            {analyzeNavigationItems.map((item) => {
              const Icon = item.icon;
              const active = item.isActive(pathname);

              return (
                <Sidebar.MenuItem
                  key={item.to}
                  href={item.to}
                  id={`Analyze-${item.label}`}
                  isCurrent={active}
                  textValue={item.label}
                >
                  <Sidebar.MenuIcon>
                    <Icon className="size-4" />
                  </Sidebar.MenuIcon>
                  <Sidebar.MenuLabel>{item.label}</Sidebar.MenuLabel>
                </Sidebar.MenuItem>
              );
            })}
          </Sidebar.Submenu>
        </Sidebar.MenuItem>
      </Sidebar.Menu>
    </Sidebar.Group>
  );
}

function SystemNavigation({ pathname }: { pathname: string }) {
  return (
    <Sidebar.Group>
      <Sidebar.Menu aria-label="System navigation" showGuideLines={false}>
        {systemNavigationItems.map((item) => {
          const Icon = item.icon;
          const active = item.isActive(pathname);

          return (
            <Sidebar.MenuItem
              key={item.to}
              href={item.to}
              id={item.to}
              isCurrent={active}
              textValue={item.label}
            >
              <Sidebar.MenuIcon>
                <Icon className="size-4" />
              </Sidebar.MenuIcon>
              <Sidebar.MenuLabel>{item.label}</Sidebar.MenuLabel>
            </Sidebar.MenuItem>
          );
        })}
      </Sidebar.Menu>
    </Sidebar.Group>
  );
}

function SidebarPanelContent({ pathname }: { pathname: string }) {
  return (
    <>
      <Sidebar.Header
        className="flex shrink-0 items-center select-none"
        style={{ height: titlebarHeight }}
      >
        <div
          aria-hidden="true"
          className="h-full shrink-0"
          data-tauri-drag-region
          data-testid="mac-traffic-space"
          style={{ width: trafficWidth }}
        />
        <div aria-hidden="true" className="h-full min-w-0 flex-1" data-tauri-drag-region />
      </Sidebar.Header>
      <Sidebar.Content className="min-h-0 flex-1 flex-col overflow-hidden">
        <AnalyzeNavigation pathname={pathname} />
        <WorkspaceNavigation pathname={pathname} />
      </Sidebar.Content>
      <Sidebar.Footer className="shrink-0">
        <SystemNavigation pathname={pathname} />
      </Sidebar.Footer>
    </>
  );
}

export function AppFrame({ children, toolbarActions }: AppFrameProps) {
  const router = useRouter();
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const activeTab = getActiveTab(pathname);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const collapsedTrafficSpaceStyle = {
    width: sidebarOpen ? "0px" : trafficWidth,
    marginRight: sidebarOpen ? `-${titlebarGap}` : "0px",
    transition: "width 0.2s ease, margin-right 0.2s ease",
  } as CSSProperties;

  return (
    <AppLayout
      className="pig-app-layout bg-background text-foreground"
      navigate={(href) => void router.navigate({ to: href as never })}
      navbar={
        <Navbar
          className="border-b border-border bg-surface"
          height={titlebarHeight}
          maxWidth="full"
        >
          <Navbar.Header className="h-full items-center">
            <div
              aria-hidden="true"
              className="h-full shrink-0 overflow-hidden"
              data-state={sidebarOpen ? "expanded" : "collapsed"}
              data-testid="collapsed-traffic-space"
              style={collapsedTrafficSpaceStyle}
            />
            <Sidebar.Trigger
              aria-label="Toggle sidebar"
              className="shrink-0"
              style={titlebarControlStyle}
            />
            <Navbar.Brand className="h-7 select-none items-center">
              <h1 className="select-none text-sm font-semibold leading-7 tracking-normal text-foreground">
                {activeTab}
              </h1>
            </Navbar.Brand>
            <Navbar.Spacer className="h-full min-w-0 flex-1 select-none" data-tauri-drag-region />
            {toolbarActions ? (
              <div
                className="flex h-full shrink-0 items-center gap-1"
                data-testid="navbar-actions"
              >
                {toolbarActions}
              </div>
            ) : null}
          </Navbar.Header>
        </Navbar>
      }
      resizableAutoSaveId="pig-app-shell"
      scrollMode="content"
      sidebar={
        <Sidebar style={sidebarStyle}>
          <SidebarPanelContent pathname={pathname} />
        </Sidebar>
      }
      sidebarCollapsible="offcanvas"
      sidebarDefaultSize={sidebarDefaultSize}
      sidebarMaxSize={sidebarMaxSize}
      sidebarMinSize={sidebarMinSize}
      sidebarOpen={sidebarOpen}
      sidebarResizable
      sidebarVariant="inset"
      onSidebarOpenChange={setSidebarOpen}
    >
      <div className="h-full min-h-0 min-w-0" data-testid="app-frame-content">
        {children}
      </div>
    </AppLayout>
  );
}
