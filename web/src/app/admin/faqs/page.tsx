import { getAdminFaqs } from "@/lib/queries/admin";
import { FaqManager } from "@/components/admin/faq-manager";

export default async function AdminFaqsPage() {
  const faqs = await getAdminFaqs();

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-display text-2xl">FAQ ({faqs.length})</h1>
      <FaqManager faqs={faqs} />
    </div>
  );
}
