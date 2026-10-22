export type GmeaInputOptions = {
  methods: string[]; suppliers: string[]; invoiceNames: string[]; clients: string[]; locations: string[]; services: string[];
};
export type GmeaSavedOptionField = "method" | "supplier" | "invoice_name";
export type GmeaInputValues = Partial<Record<keyof GmeaInputOptions, string>>;
