/**
 * ============================================================================
 *  CHATTERBOX MULTILINGUAL v3 — BAĞIMSIZ TEST WORKER'I
 *  ----------------------------------------------------------------------------
 *  Resemble AI · Chatterbox Multilingual (MIT lisans) · Türkçe destekli
 *  Sağlayıcı: fal.ai  (basit HTTP REST — Worker dostu)
 *
 *  KURULUM (2 dakika):
 *   1) Cloudflare Dashboard → Workers & Pages → Create → Create Worker
 *   2) Bu dosyanın TAMAMINI editöre yapıştır → Deploy
 *   3) Worker → Settings → Variables and Secrets → Add:
 *        Name:  FAL_KEY
 *        Value: fal.ai'den aldığın anahtar   (https://fal.ai/dashboard/keys)
 *        [Encrypt] işaretle → Save/Deploy
 *   4) Worker adresini tarayıcıda aç → test sayfası gelir.
 *
 *  fal.ai ücretsiz kredi ile başlar; kart eklemeden deneyebilirsin.
 * ============================================================================
 */

const FAL_ENDPOINT = 'https://fal.run/fal-ai/chatterbox/text-to-speech/multilingual';

// 23 dilin bir kısmı — Türkçe varsayılan
const LANGUAGES = [
  ['tr', 'Türkçe'], ['en', 'İngilizce'], ['de', 'Almanca'], ['fr', 'Fransızca'],
  ['es', 'İspanyolca'], ['it', 'İtalyanca'], ['ar', 'Arapça'], ['ru', 'Rusça'],
  ['pt', 'Portekizce'], ['nl', 'Felemenkçe'], ['pl', 'Lehçe'], ['ja', 'Japonca'],
  ['ko', 'Korece'], ['zh', 'Çince'], ['hi', 'Hintçe'], ['el', 'Yunanca'],
];

function cors(extra = {}) {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    ...extra,
  };
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: cors() });
    }

    // Test sayfası
    if (request.method === 'GET' && url.pathname === '/') {
      return new Response(PAGE, {
        headers: { 'Content-Type': 'text/html; charset=utf-8', ...cors() },
      });
    }

    // TTS çağrısı
    if (request.method === 'POST' && url.pathname === '/tts') {
      if (!env.FAL_KEY) {
        return json({ error: 'FAL_KEY tanımlı değil. Worker → Settings → Variables kısmından ekle.' }, 500);
      }

      let body;
      try {
        body = await request.json();
      } catch {
        return json({ error: 'Geçersiz JSON gövdesi.' }, 400);
      }

      const text = (body.text || '').toString().trim();
      if (!text) return json({ error: 'Metin boş olamaz.' }, 400);
      if (text.length > 500) {
        return json({ error: 'Chatterbox tek seferde en fazla 500 karakter alır. Metni kısalt veya parçala.' }, 400);
      }

      // fal.ai payload — sadece dolu alanları gönder
      const payload = {
        text,
        language_code: body.language_code || 'tr',
      };
      if (body.audio_url) payload.audio_url = body.audio_url;               // referans ses (klonlama, opsiyonel)
      if (body.exaggeration != null) payload.exaggeration = Number(body.exaggeration);
      if (body.cfg != null) payload.cfg = Number(body.cfg);
      if (body.temperature != null) payload.temperature = Number(body.temperature);

      try {
        const r = await fetch(FAL_ENDPOINT, {
          method: 'POST',
          headers: {
            'Authorization': `Key ${env.FAL_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });

        const data = await r.json().catch(() => ({}));

        if (!r.ok) {
          const msg = data?.detail || data?.error || data?.message || `Sağlayıcı hatası (${r.status})`;
          return json({ error: typeof msg === 'string' ? msg : JSON.stringify(msg), status: r.status }, r.status);
        }

        // fal genelde { audio: { url } } döner
        const audioUrl = data?.audio?.url || data?.audio_url || data?.url;
        if (!audioUrl) {
          return json({ error: 'Ses URL’si bulunamadı.', raw: data }, 502);
        }
        return json({ audio_url: audioUrl, raw: data });
      } catch (e) {
        return json({ error: 'Ağ hatası: ' + (e?.message || e) }, 502);
      }
    }

    return new Response('Not Found', { status: 404, headers: cors() });
  },
};

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', ...cors() },
  });
}

// ── Test sayfası (tek dosyada gömülü) ───────────────────────────────────────
const PAGE = `<!doctype html>
<html lang="tr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Chatterbox Multilingual v3 — Türkçe TTS Testi</title>
<style>
  :root{--bg:#0b0f17;--card:#141b26;--b:#233042;--tx:#e8eef6;--mu:#8ba0b8;--ac:#67e8f9;--ac2:#a78bfa;--er:#f87171}
  *{box-sizing:border-box}
  body{margin:0;background:var(--bg);color:var(--tx);font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:20px}
  .card{width:100%;max-width:640px;background:var(--card);border:1px solid var(--b);border-radius:18px;padding:26px 24px;box-shadow:0 20px 60px rgba(0,0,0,.4)}
  h1{margin:0 0 4px;font-size:20px;background:linear-gradient(135deg,var(--ac),var(--ac2));-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent}
  .sub{color:var(--mu);font-size:13px;margin-bottom:20px}
  label{display:block;font-size:12px;color:var(--mu);margin:14px 0 6px;font-weight:600}
  textarea,select,input{width:100%;background:#0e1420;border:1px solid var(--b);border-radius:11px;color:var(--tx);padding:11px 13px;font-size:14px;font-family:inherit}
  textarea{min-height:110px;resize:vertical}
  .row{display:flex;gap:12px}.row>*{flex:1}
  .count{font-size:11px;color:var(--mu);text-align:right;margin-top:4px}
  button{margin-top:20px;width:100%;padding:13px;border:none;border-radius:12px;background:linear-gradient(135deg,var(--ac),var(--ac2));color:#0b0f17;font-size:15px;font-weight:700;cursor:pointer;transition:transform .15s,opacity .15s}
  button:hover:not(:disabled){transform:translateY(-1px)}
  button:disabled{opacity:.5;cursor:not-allowed}
  audio{width:100%;margin-top:18px;display:none}
  audio.show{display:block}
  .msg{margin-top:14px;font-size:13px;padding:10px 12px;border-radius:10px;display:none}
  .msg.show{display:block}
  .msg.err{background:rgba(248,113,113,.12);border:1px solid rgba(248,113,113,.3);color:var(--er)}
  .msg.ok{background:rgba(103,232,249,.1);border:1px solid rgba(103,232,249,.3);color:var(--ac)}
  details{margin-top:16px;font-size:12px;color:var(--mu)}
  summary{cursor:pointer}
  .adv{margin-top:10px}
</style>
</head>
<body>
<div class="card">
  <h1>🎙️ Chatterbox Multilingual v3</h1>
  <div class="sub">MIT lisanslı · Türkçe destekli · fal.ai üzerinden · Neo AI test</div>

  <label>Metin (maks. 500 karakter)</label>
  <textarea id="text" placeholder="Merhaba, ben Neo. Bugün sana nasıl yardımcı olabilirim?">Merhaba, ben Neo. Bugün sana nasıl yardımcı olabilirim?</textarea>
  <div class="count"><span id="count">0</span>/500</div>

  <div class="row">
    <div>
      <label>Dil</label>
      <select id="lang">${LANGUAGES.map(([c, n]) => `<option value="${c}">${n}</option>`).join('')}</select>
    </div>
    <div>
      <label>Duygu / Vurgu (exaggeration)</label>
      <input id="exag" type="number" step="0.05" min="0" max="1" value="0.5">
    </div>
  </div>

  <details class="adv">
    <summary>Gelişmiş ayarlar</summary>
    <div class="row" style="margin-top:10px">
      <div><label>cfg</label><input id="cfg" type="number" step="0.1" value="0.5"></div>
      <div><label>temperature</label><input id="temp" type="number" step="0.1" value="0.8"></div>
    </div>
    <label>Referans ses URL'si (opsiyonel — ses klonlama)</label>
    <input id="ref" type="url" placeholder="https://.../ornek-ses.wav">
  </details>

  <button id="go">Seslendir</button>
  <audio id="player" controls></audio>
  <div id="msg" class="msg"></div>
</div>

<script>
  const $ = id => document.getElementById(id);
  const text = $('text'), count = $('count'), msg = $('msg'), player = $('player'), go = $('go');
  const upd = () => count.textContent = text.value.length;
  text.addEventListener('input', upd); upd();

  function show(t, ok) { msg.textContent = t; msg.className = 'msg show ' + (ok ? 'ok' : 'err'); }

  go.onclick = async () => {
    const body = {
      text: text.value.trim(),
      language_code: $('lang').value,
      exaggeration: parseFloat($('exag').value),
      cfg: parseFloat($('cfg').value),
      temperature: parseFloat($('temp').value),
    };
    if ($('ref').value.trim()) body.audio_url = $('ref').value.trim();
    if (!body.text) return show('Metin boş olamaz.', false);

    go.disabled = true; go.textContent = 'Üretiliyor…'; msg.className = 'msg'; player.className = 'audio';
    try {
      const r = await fetch('/tts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const d = await r.json();
      if (!r.ok || d.error) return show('Hata: ' + (d.error || r.status), false);
      player.src = d.audio_url; player.className = 'audio show'; player.play().catch(()=>{});
      show('Ses hazır. ▶️', true);
    } catch (e) {
      show('Ağ hatası: ' + e.message, false);
    } finally {
      go.disabled = false; go.textContent = 'Seslendir';
    }
  };
</script>
</body>
</html>`;
