import { Slot, useLocalSearchParams } from 'expo-router';
import { useSession } from '@/features/auth/hooks/session';
import { ReportWorkspaceProvider } from '@/features/reports/hooks/report-workspace';

export default function ReportLayout() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useSession();
  return <ReportWorkspaceProvider key={`${user?.id}:${id}`} id={id}><Slot /></ReportWorkspaceProvider>;
}
