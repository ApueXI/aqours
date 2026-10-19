import type { Connection, User } from '@aqours/contracts';
import { View } from 'react-native';
import { useSession } from '@/auth/session';
import { Body, Button, Screen, Section, styles } from '@/components/ui';
import { ResourceState } from '@/components/resource-state';
import { useResource } from '@/hooks/use-resource';

export default function Profile() {
  const { logout } = useSession();
  const profile = useResource<User>('/me');
  const connections = useResource<Connection[]>('/me/connections');
  return <Screen title="Your profile">
    <ResourceState {...profile} />
    {profile.data && <Section><Body>{profile.data.name}</Body><Body>{profile.data.email}</Body><Body>{profile.data.phone ?? 'No phone number on file'}</Body></Section>}
    <Section title="Service connections">
      <ResourceState {...connections} empty={connections.data?.length === 0 && 'No saved connection. Contact the supplier for provisioning.'} />
      {connections.data?.map((connection) => <View key={connection.id} style={styles.item}>
        <Body>{connection.reference}</Body><Body>{connection.address}</Body>
        <Body muted>Zone: {connection.zoneConfirmed ? 'Supplier confirmed' : 'Awaiting supplier review'}</Body>
        <Body muted>Coordinates: {connection.latitude === null ? 'Not recorded; address reporting is available.' : `${connection.latitude}, ${connection.longitude}`}</Body>
      </View>)}
    </Section>
    <Body muted>The supplier maintains saved connection details. An alternate issue address only applies to that report.</Body>
    <Button title="Sign out" onPress={() => void logout()} />
  </Screen>;
}
