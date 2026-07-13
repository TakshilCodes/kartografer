import { getServerSession } from "next-auth";

import NavbarClient from "@/components/shared/NavbarClient";
import { authOptions } from "@/lib/auth";

export default async function Navbar() {
  const session = await getServerSession(authOptions);
  return <NavbarClient isLoggedIn={Boolean(session?.user.id)} />;
}
