import { endpoint, sameOrigin } from "@/lib/http";
import { executeAdminCommand } from "@/lib/server/admin";
export async function POST(request: Request) {
  return endpoint(async () => {
    sameOrigin(request);
    return executeAdminCommand(await request.json());
  });
}
