import { getClients } from "@/lib/client/actions";
import { ClientList } from "@/components/client/ClientList";

export const dynamic = "force-dynamic";

export default async function ClientsPage() {
  const clients = await getClients();
  return <ClientList clients={clients} />;
}
