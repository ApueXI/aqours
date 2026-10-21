export type PsgcLevel = 'region' | 'province' | 'city' | 'municipality' | 'sub_municipality' | 'barangay';
export interface PsgcPart { code: string; name: string; level: PsgcLevel }
export interface PsgcPlace extends PsgcPart { hasChildren: boolean }
export interface StructuredAddressInput { barangayCode: string; streetDetails: string }
export interface AddressSnapshot extends StructuredAddressInput {
  datasetVersion: string; ancestry: PsgcPart[];
}
