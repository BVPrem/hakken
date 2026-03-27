import { redirect } from "next/navigation";

export default function RootPage() {
  // Simply redirect to sign-in - middleware handles auth protection
  // so root always redirects to sign-in for non-authenticated users
  redirect("/sign-in");
}