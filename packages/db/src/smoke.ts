import { getDb, listCities, findCityBySlug, getLandingData, searchSitters } from './index.js';
const db = getDb(process.env.DATABASE_URL);

const cities = await listCities(db);
console.log('sehirler:', cities.map(c => `${c.slugEn}(t${c.tier})`).join(' '));

for (const slug of ['toronto', 'hamilton', 'london', 'victoria']) {
  const c = await findCityBySlug(db, slug, 'en-CA');
  if (!c) { console.log(slug, 'bulunamadi'); continue; }
  const d = await getLandingData(db, c, 'boarding', 'en-CA');
  console.log(
    `${c.nameEn.padEnd(10)} bakici=${String(d.sitterCount).padStart(2)}  ` +
    `medyan=$${(d.medianPriceCents/100).toFixed(0)} (p25 $${(d.p25PriceCents/100).toFixed(0)}–p75 $${(d.p75PriceCents/100).toFixed(0)})  ` +
    `rezervasyon=${String(d.bookingCount).padStart(4)}  yorum=${String(d.reviewCount).padStart(4)}  ` +
    `puan=${d.avgRating}  yanit=${d.medianResponseMinutes}dk  mahalle=[${d.topNeighbourhoods.join(', ')}]  ` +
    `listelenen=${d.sitters.length}`
  );
}

const mtl = await findCityBySlug(db, 'montreal', 'fr-CA');
const fr = await getLandingData(db, mtl!, 'boarding', 'fr-CA');
console.log('\nMontreal (fr-CA) mahalleler:', fr.topNeighbourhoods.join(', '));
console.log('ilk bakici:', fr.sitters[0]?.firstName, fr.sitters[0]?.neighbourhood, '$'+(fr.sitters[0]!.priceCents/100));

console.log('\n=== PostGIS arama: Leslieville 5 km, 20 kg kopek, kedi kabul, cit zorunlu ===');
const res = await searchSitters(db, {
  serviceType: 'boarding', lon: -79.3300, lat: 43.6640, radiusMeters: 5000,
  petWeightKg: 20, needsCats: true, requireFencedYard: true, limit: 5,
}, 'en-CA');
for (const r of res) {
  console.log(`  ${r.firstName} ${r.lastNameInitial}. ${r.neighbourhood.padEnd(16)} $${(r.priceCents/100).toFixed(0)}  ${(r.distanceMeters/1000).toFixed(2)} km  rozet ${r.badgeLevel}`);
}

console.log('\n=== musaitlik filtresi etkisi ===');
const noDates = await searchSitters(db, { serviceType:'boarding', lon:-79.38, lat:43.65, radiusMeters:12000, limit:100 }, 'en-CA');
const withDates = await searchSitters(db, { serviceType:'boarding', lon:-79.38, lat:43.65, radiusMeters:12000, limit:100,
  startDate: new Date(Date.now()+7*864e5).toISOString().slice(0,10),
  endDate: new Date(Date.now()+12*864e5).toISOString().slice(0,10) }, 'en-CA');
console.log(`  tarihsiz ${noDates.length} -> 5 gecelik aralikla ${withDates.length} bakici`);
process.exit(0);
