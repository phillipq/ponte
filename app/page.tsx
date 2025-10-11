import { redirect } from "next/navigation"

export default function Web() {
  // Redirect to login page as the homepage
  redirect("/auth/signin")
}
