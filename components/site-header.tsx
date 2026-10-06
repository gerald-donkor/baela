import { getViewer } from "@/lib/auth/server";
import { SiteHeaderContent } from "./site-header-content";
export async function SiteHeader() {
  const user = await getViewer();
  return (
    <header className="relative z-30">
      <SiteHeaderContent signedIn={!!user} admin={!!user?.admin} />
    </header>
  );
}
