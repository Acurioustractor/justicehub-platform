export interface FallbackDetentionFacility {
  id: string;
  name: string;
  slug: string;
  city: string;
  state: string;
  latitude: number;
  longitude: number;
  capacity_beds: number;
  operational_status: string;
  government_department: string;
  security_level: string;
  partnership_count: number;
}

export const FALLBACK_DETENTION_FACILITIES: FallbackDetentionFacility[] = [
  { id: 'brisbane-ydc', name: 'Brisbane Youth Detention Centre', slug: 'brisbane-ydc', city: 'Wacol', state: 'QLD', latitude: -27.5945, longitude: 152.9339, capacity_beds: 96, operational_status: 'operational', government_department: 'Department of Youth Justice', security_level: 'maximum', partnership_count: 0 },
  { id: 'cleveland-ydc', name: 'Cleveland Youth Detention Centre', slug: 'cleveland-ydc', city: 'Townsville', state: 'QLD', latitude: -19.259, longitude: 146.8169, capacity_beds: 48, operational_status: 'operational', government_department: 'Department of Youth Justice', security_level: 'maximum', partnership_count: 0 },
  { id: 'cobham-jjc', name: 'Cobham Juvenile Justice Centre', slug: 'cobham-jjc', city: 'Werrington', state: 'NSW', latitude: -33.7573, longitude: 150.7533, capacity_beds: 42, operational_status: 'operational', government_department: 'Youth Justice NSW', security_level: 'maximum', partnership_count: 0 },
  { id: 'frank-baxter-jjc', name: 'Frank Baxter Juvenile Justice Centre', slug: 'frank-baxter-jjc', city: 'Kariong', state: 'NSW', latitude: -33.4386, longitude: 151.2976, capacity_beds: 120, operational_status: 'operational', government_department: 'Youth Justice NSW', security_level: 'maximum', partnership_count: 0 },
  { id: 'reiby-jjc', name: 'Reiby Juvenile Justice Centre', slug: 'reiby-jjc', city: 'Airds', state: 'NSW', latitude: -34.0819, longitude: 150.8281, capacity_beds: 60, operational_status: 'operational', government_department: 'Youth Justice NSW', security_level: 'medium', partnership_count: 0 },
  { id: 'orana-jjc', name: 'Orana Juvenile Justice Centre', slug: 'orana-jjc', city: 'Dubbo', state: 'NSW', latitude: -32.2569, longitude: 148.6011, capacity_beds: 30, operational_status: 'operational', government_department: 'Youth Justice NSW', security_level: 'medium', partnership_count: 0 },
  { id: 'acmena-jjc', name: 'Acmena Juvenile Justice Centre', slug: 'acmena-jjc', city: 'Grafton', state: 'NSW', latitude: -29.6767, longitude: 152.937, capacity_beds: 36, operational_status: 'operational', government_department: 'Youth Justice NSW', security_level: 'medium', partnership_count: 0 },
  { id: 'parkville-yjc', name: 'Parkville Youth Justice Centre', slug: 'parkville-yjc', city: 'Parkville', state: 'VIC', latitude: -37.7839, longitude: 144.949, capacity_beds: 100, operational_status: 'operational', government_department: 'Department of Justice and Community Safety', security_level: 'maximum', partnership_count: 0 },
  { id: 'malmsbury-yjc', name: 'Malmsbury Youth Justice Centre', slug: 'malmsbury-yjc', city: 'Malmsbury', state: 'VIC', latitude: -37.1859, longitude: 144.3743, capacity_beds: 120, operational_status: 'operational', government_department: 'Department of Justice and Community Safety', security_level: 'maximum', partnership_count: 0 },
  { id: 'banksia-hill', name: 'Banksia Hill Detention Centre', slug: 'banksia-hill', city: 'Canning Vale', state: 'WA', latitude: -32.0766, longitude: 115.918, capacity_beds: 240, operational_status: 'operational', government_department: 'Department of Justice WA', security_level: 'maximum', partnership_count: 0 },
  { id: 'adelaide-ytc', name: 'Adelaide Youth Training Centre', slug: 'adelaide-ytc', city: 'Cavan', state: 'SA', latitude: -34.8366, longitude: 138.5977, capacity_beds: 76, operational_status: 'operational', government_department: 'Department of Human Services SA', security_level: 'maximum', partnership_count: 0 },
  { id: 'don-dale', name: 'Don Dale Youth Detention Centre', slug: 'don-dale', city: 'Berrimah', state: 'NT', latitude: -12.4308, longitude: 130.9167, capacity_beds: 36, operational_status: 'operational', government_department: 'Territory Families', security_level: 'maximum', partnership_count: 0 },
  { id: 'alice-springs-ydc', name: 'Alice Springs Youth Detention Centre', slug: 'alice-springs-ydc', city: 'Alice Springs', state: 'NT', latitude: -23.698, longitude: 133.8807, capacity_beds: 24, operational_status: 'operational', government_department: 'Territory Families', security_level: 'medium', partnership_count: 0 },
  { id: 'ashley-ydc', name: 'Ashley Youth Detention Centre', slug: 'ashley-ydc', city: 'Deloraine', state: 'TAS', latitude: -41.5175, longitude: 146.6503, capacity_beds: 51, operational_status: 'operational', government_department: 'Department of Communities Tasmania', security_level: 'medium', partnership_count: 0 },
  { id: 'bimberi-yjc', name: 'Bimberi Youth Justice Centre', slug: 'bimberi-yjc', city: 'Mitchell', state: 'ACT', latitude: -35.2093, longitude: 149.1287, capacity_beds: 40, operational_status: 'operational', government_department: 'ACT Community Services', security_level: 'medium', partnership_count: 0 },
];
