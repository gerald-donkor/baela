import { getViewer } from "@/lib/auth/server";
import { SiteHeaderContent } from "./site-header-content";
export async function SiteHeader() {
  const user = await getViewer();
  return (
    <header className="relative z-30">
      <SiteHeaderContent
        user={user ? { name: user.name, email: user.email } : null}
        admin={!!user?.admin}
      />
    </header>
  );
}
