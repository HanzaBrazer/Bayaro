import { redirect } from "next/navigation";

// Root diarahkan ke aplikasi. Middleware akan meneruskan ke /login bila belum masuk.
export default function Home() {
  redirect("/dashboard");
}
