/** Hizmet tipleri ve fazlandirma (yol haritasi §5.1) */

export const SERVICE_TYPES = [
  'boarding',       // Konaklama — bakici evinde
  'house_sitting',  // Evde bakim — sahibin evinde
  'drop_in',        // Gunluk ziyaret
  'dog_walking',    // Kopek gezdirme
  'day_care',       // Gunduz bakimi
  'training',       // Egitim
  'grooming',       // Timar
] as const;

export type ServiceType = (typeof SERVICE_TYPES)[number];

export type PriceUnit = 'night' | 'visit' | 'walk' | 'day' | 'session';

export interface ServiceDefinition {
  readonly type: ServiceType;
  readonly unit: PriceUnit;
  /** Hangi surumde canliya alinacak */
  readonly phase: 'v1' | 'v1_5' | 'v2';
  /** Ayni anda birden fazla gun/gece kapsayabilir mi */
  readonly multiDay: boolean;
}

export const SERVICES: Readonly<Record<ServiceType, ServiceDefinition>> = {
  boarding:      { type: 'boarding',      unit: 'night',   phase: 'v1',   multiDay: true },
  house_sitting: { type: 'house_sitting', unit: 'night',   phase: 'v1',   multiDay: true },
  drop_in:       { type: 'drop_in',       unit: 'visit',   phase: 'v1',   multiDay: true },
  dog_walking:   { type: 'dog_walking',   unit: 'walk',    phase: 'v1',   multiDay: false },
  day_care:      { type: 'day_care',      unit: 'day',     phase: 'v1_5', multiDay: true },
  training:      { type: 'training',      unit: 'session', phase: 'v2',   multiDay: false },
  grooming:      { type: 'grooming',      unit: 'session', phase: 'v2',   multiDay: false },
};

export function servicesForPhase(phase: 'v1' | 'v1_5' | 'v2'): ServiceType[] {
  const order = { v1: 0, v1_5: 1, v2: 2 } as const;
  return SERVICE_TYPES.filter((s) => order[SERVICES[s].phase] <= order[phase]);
}
