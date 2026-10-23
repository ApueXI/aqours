/** Keep customer connection data in the atomic provisioning request only. */
export function provisionAccountBody(values: Record<string, unknown>) {
  const { reference, address, structuredAddress, zoneId, zoneConfirmed, ...account } = values;
  return account.role === 'customer' ? {
    ...account,
    connection: { ...(reference ? { reference } : {}), address, structuredAddress, zoneId, zoneConfirmed },
  } : account;
}
