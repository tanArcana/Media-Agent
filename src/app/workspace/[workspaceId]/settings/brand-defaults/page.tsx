import { BrandDefaultsForm } from '@/components/settings/brand-defaults-form';

interface Props {
  params: { workspaceId: string };
}

export default function BrandDefaultsPage({ params }: Props) {
  return <BrandDefaultsForm workspaceId={params.workspaceId} />;
}
