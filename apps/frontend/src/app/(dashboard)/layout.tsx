import EnergyDashboard from "@/components/dashboard/dashboard";
import { AuthProvider } from "@/providers/auth-provider";
import { DarkModeProvider } from "@/providers/dark-mode-provider";

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <AuthProvider>
      <DarkModeProvider>
        <EnergyDashboard>{children}</EnergyDashboard>
      </DarkModeProvider>
    </AuthProvider>
  );
}
