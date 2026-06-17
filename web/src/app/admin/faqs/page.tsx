import { getAdminFaqs } from "@/lib/queries/admin";
import { FaqManager } from "@/components/admin/faq-manager";
import { PageHeader } from "@/components/admin/ui";

export default async function AdminFaqsPage() {
  const faqs = await getAdminFaqs();

  return (
    <div className="flex flex-col gap-8">
      <PageHeader eyebrow="Support" title="FAQ" count={`${faqs.length}개`} />
      <FaqManager faqs={faqs} />
    </div>
  );
}
