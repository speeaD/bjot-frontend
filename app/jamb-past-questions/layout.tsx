import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";

export default async function PastQuestionAdminLayout({ children }: { children: React.ReactNode }) {
  const token = (await cookies()).get("auth-token")?.value;
  if (!token) redirect("/login");
  const base = process.env.BACKEND_URL;
  if (!base) return children;
  // This endpoint already exists on deployed backends and requires verifyAdmin.
  // Keep the page usable while a newly added past-question API is being deployed.
  let response: Response;
  try {
    response = await fetch(`${base.replace(/\/$/, "")}/questionset/template/download`, {
      headers: { Authorization: `Bearer ${token}` }, cache: "no-store",
    });
  } catch {
    return children;
  }
  if (response.status === 401) redirect("/login");
  if (response.status === 403) notFound();
  return children;
}
