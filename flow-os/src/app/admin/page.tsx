import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import AdminDashboardClient from "./AdminDashboardClient";

export default async function AdminDashboardPage() {
  const cookieStore = await cookies();
  const session = cookieStore.get("smartopd_admin");

  if (!session || session.value !== "authenticated") {
    redirect("/admin/login");
  }

  return <AdminDashboardClient />;
}
