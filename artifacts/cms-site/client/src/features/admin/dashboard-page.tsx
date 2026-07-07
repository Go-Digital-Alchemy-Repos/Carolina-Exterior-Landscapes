import { useQuery } from "@tanstack/react-query";
import { STALE_TIMES } from "@/lib/queryClient";
import { ProtectedRoute } from "@/components/shared/protected-route";
import { AdminSidebar } from "./admin-sidebar";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart, XAxis, YAxis } from "recharts";
import { Activity, FileCode, FileText, Images, Mail, Rows3, SquarePen, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface DashboardStats {
  totalUsers: number;
  publishedPages: number;
  draftPages: number;
  totalForms: number;
  unreadMessages: number;
  mediaAssets: number;
}

interface AnalyticsData {
  usersByRole: { role: string; count: number }[];
  pagesByStatus: { status: string; count: number }[];
  submissionsTrend: { month: string; count: number }[];
  contactsTrend: { month: string; count: number }[];
  recentActivity: {
    id: string;
    action: string;
    details: string | null;
    createdAt: string;
    userName: string;
  }[];
  totalSections: number;
}

export default function AdminDashboardPage() {
  return (
    <ProtectedRoute roles={["admin"]}>
      <AdminSidebar>
        <DashboardContent />
      </AdminSidebar>
    </ProtectedRoute>
  );
}

const PIE_COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
];

const submissionsConfig = {
  count: { label: "Submissions", color: "hsl(var(--chart-1))" },
} satisfies ChartConfig;

const contactsConfig = {
  count: { label: "Messages", color: "hsl(var(--chart-3))" },
} satisfies ChartConfig;

const pieConfig = {
  count: { label: "Count" },
} satisfies ChartConfig;

function formatMonth(monthStr: string) {
  const [year, month] = monthStr.split("-");
  const date = new Date(Number(year), Number(month) - 1);
  return date.toLocaleDateString("en-US", { month: "short" });
}

function formatAction(action: string) {
  return action.replace(/_/g, " ").replace(/\b\w/g, (character) => character.toUpperCase());
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function DashboardContent() {
  const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/admin/dashboard-stats"],
    staleTime: STALE_TIMES.LIVE,
    refetchOnWindowFocus: true,
    refetchInterval: 60_000,
  });

  const { data: analytics, isLoading: analyticsLoading } = useQuery<AnalyticsData>({
    queryKey: ["/api/admin/dashboard-analytics"],
    staleTime: STALE_TIMES.OPERATIONAL,
    refetchOnWindowFocus: true,
    refetchInterval: 5 * 60_000,
  });

  if (statsLoading || analyticsLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <LoadingSpinner />
      </div>
    );
  }

  const statCards = [
    { title: "Total Users", value: stats?.totalUsers ?? 0, icon: Users, color: "text-blue-600" },
    { title: "Published Pages", value: stats?.publishedPages ?? 0, icon: FileCode, color: "text-emerald-600" },
    { title: "Draft Pages", value: stats?.draftPages ?? 0, icon: FileText, color: "text-amber-600" },
    { title: "Forms", value: stats?.totalForms ?? 0, icon: SquarePen, color: "text-violet-600" },
    { title: "Unread Messages", value: stats?.unreadMessages ?? 0, icon: Mail, color: "text-rose-600" },
    { title: "Media Assets", value: stats?.mediaAssets ?? 0, icon: Images, color: "text-cyan-600" },
    { title: "Saved Sections", value: analytics?.totalSections ?? 0, icon: Rows3, color: "text-slate-600" },
  ];

  const submissionsData = (analytics?.submissionsTrend ?? []).map((row) => ({
    ...row,
    label: formatMonth(row.month),
  }));

  const contactsData = (analytics?.contactsTrend ?? []).map((row) => ({
    ...row,
    label: formatMonth(row.month),
  }));

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-heading font-semibold" data-testid="text-admin-dashboard-title">
          Dashboard
        </h1>
        <Badge variant="outline" className="text-xs text-muted-foreground" data-testid="badge-last-refresh">
          <Activity className="mr-1 h-3 w-3" />
          Live
        </Badge>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-7">
        {statCards.map((card) => (
          <Card key={card.title} data-testid={`card-stat-${card.title.toLowerCase().replace(/\s+/g, "-")}`}>
            <CardContent className="px-4 pb-3 pt-4">
              <card.icon className={`mb-2 h-4 w-4 ${card.color}`} />
              <div className="text-2xl font-bold" data-testid={`text-stat-value-${card.title.toLowerCase().replace(/\s+/g, "-")}`}>
                {card.value}
              </div>
              <p className="mt-0.5 text-xs text-muted-foreground">{card.title}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card data-testid="card-form-submissions-trend">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Form Submissions</CardTitle>
            <CardDescription>Stored submissions over the last 6 months</CardDescription>
          </CardHeader>
          <CardContent>
            {submissionsData.length > 0 ? (
              <ChartContainer config={submissionsConfig} className="h-[220px] w-full">
                <LineChart data={submissionsData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line type="monotone" dataKey="count" stroke="var(--color-count)" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ChartContainer>
            ) : (
              <div className="flex h-[220px] items-center justify-center text-sm text-muted-foreground">
                No submission data yet
              </div>
            )}
          </CardContent>
        </Card>

        <Card data-testid="card-contacts-trend">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Contact Messages</CardTitle>
            <CardDescription>Incoming messages over the last 6 months</CardDescription>
          </CardHeader>
          <CardContent>
            {contactsData.length > 0 ? (
              <ChartContainer config={contactsConfig} className="h-[220px] w-full">
                <BarChart data={contactsData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="count" fill="var(--color-count)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ChartContainer>
            ) : (
              <div className="flex h-[220px] items-center justify-center text-sm text-muted-foreground">
                No contact data yet
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card data-testid="card-page-status">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">CMS Page Status</CardTitle>
            <CardDescription>Current page publishing state</CardDescription>
          </CardHeader>
          <CardContent>
            {(analytics?.pagesByStatus ?? []).length > 0 ? (
              <ChartContainer config={pieConfig} className="h-[220px] w-full">
                <PieChart>
                  <Pie data={analytics?.pagesByStatus} dataKey="count" nameKey="status" cx="50%" cy="50%" outerRadius={78} innerRadius={42} paddingAngle={2}>
                    {(analytics?.pagesByStatus ?? []).map((_entry, index) => (
                      <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <ChartTooltip content={<ChartTooltipContent nameKey="status" />} />
                </PieChart>
              </ChartContainer>
            ) : (
              <div className="flex h-[220px] items-center justify-center text-sm text-muted-foreground">
                No pages yet
              </div>
            )}
          </CardContent>
        </Card>

        <Card data-testid="card-recent-activity">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Activity className="h-4 w-4" />
              Recent Activity
            </CardTitle>
            <CardDescription>Latest system actions</CardDescription>
          </CardHeader>
          <CardContent>
            {(analytics?.recentActivity ?? []).length > 0 ? (
              <div className="max-h-[280px] space-y-2 overflow-y-auto pr-1">
                {analytics?.recentActivity.map((entry) => (
                  <div key={entry.id} className="flex items-start gap-3 border-b py-2 last:border-b-0" data-testid={`activity-row-${entry.id}`}>
                    <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm">
                        <span className="font-medium">{entry.userName}</span>{" "}
                        <span className="text-muted-foreground">{formatAction(entry.action)}</span>
                      </p>
                      {entry.details ? <p className="truncate text-xs text-muted-foreground">{entry.details}</p> : null}
                    </div>
                    <span className="shrink-0 whitespace-nowrap text-xs text-muted-foreground">{timeAgo(entry.createdAt)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex h-[220px] items-center justify-center text-sm text-muted-foreground">
                No recent activity
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
