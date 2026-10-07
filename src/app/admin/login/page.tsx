import { redirect } from "next/navigation";

// The admin now signs in on the same /login page as everyone else.
export default function AdminLoginRedirect() {
  redirect("/login?next=/admin");
}
