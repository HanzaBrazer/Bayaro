export interface SearchInvoiceHit {
  id: string;
  number: string;
  clientName: string | null;
  total: number;
  status: string;
}

export interface SearchClientHit {
  id: string;
  name: string;
  email: string | null;
}

export interface SearchResults {
  invoices: SearchInvoiceHit[];
  clients: SearchClientHit[];
}
