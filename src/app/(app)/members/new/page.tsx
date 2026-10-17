import { createClient } from '@/lib/supabase/server';
import PageHeader from '@/components/ui/PageHeader';
import NewMemberForm from './NewMemberForm';

export default async function NewMember() {
  const { data: plans } = await createClient().from('plans').select('id, name, price').eq('active', true).order('price');
  return (
    <>
      <PageHeader
        title="Add member"
        sub="Automatically notify members via Email or WhatsApp (Zapier) if payments are remaining."
      />
      <NewMemberForm plans={plans ?? []} />
    </>
  );
}
