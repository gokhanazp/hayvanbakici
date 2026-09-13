import { spawnSync } from 'node:child_process';
import { watch } from 'node:fs';

/**
 * TOKEN IZLEYICI.
 *
 * tokens paketinin build'i iki asamali: tsc + tokens.css ureten bir script.
 * Duz `tsc --watch` ikincisini calistirmaz, dolayisiyla renk degisiklikleri
 * calisan dev sunucusuna HIC ulasmaz — degistirdim, hicbir sey olmadi
 * hatasinin kaynagi budur.
 *
 * Node'un kendi fs.watch'i yeterli; ayri bir bagimlilik eklemeye degmez.
 */
let timer = null;

function build() {
  const r = spawnSync('npm', ['run', 'build'], { stdio: 'inherit', shell: false });
  if (r.status !== 0) console.error('[tokens] derleme basarisiz');
  else console.log('[tokens] guncellendi', new Date().toLocaleTimeString());
}

build();

watch(new URL('./src', import.meta.url), { recursive: true }, (_event, file) => {
  if (!file || !file.endsWith('.ts')) return;
  // Editorler tek kaydetmede birkac olay uretir; son olaydan sonra bir kez calis.
  clearTimeout(timer);
  timer = setTimeout(build, 120);
});

console.log('[tokens] src izleniyor…');
