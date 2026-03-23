/**
 * Cloudflare Pages Function — Contact form handler
 * POST /api/contact
 *
 * Setup:
 *   1. Create account at resend.com (free tier: 100 emails/day)
 *   2. Verify a sending domain (or use onboarding@resend.dev for testing)
 *   3. Set env variable in Cloudflare Pages dashboard:
 *      RESEND_API_KEY = re_xxxxxxxxxxxx
 *   4. Update FROM_ADDRESS below to your verified sender
 */

const TO_ADDRESS   = 'taichi.o@oneddy.net';
const FROM_ADDRESS = 'portfolio@taichiokada.com'; // ← update to your verified sender domain
const FROM_NAME    = 'Taichi Okada Portfolio';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  });
}

export async function onRequestPost({ request, env }) {
  try {
    // --- Parse body (form or JSON) ---
    const ct = request.headers.get('Content-Type') || '';
    let data = {};

    if (ct.includes('application/json')) {
      data = await request.json();
    } else if (ct.includes('multipart/form-data') || ct.includes('application/x-www-form-urlencoded')) {
      const fd = await request.formData();
      for (const [k, v] of fd.entries()) data[k] = v;
    } else {
      return json({ error: 'Unsupported content type' }, 400);
    }

    // --- Honeypot (spam) ---
    if (data._gotcha) return json({ ok: true }); // silently discard

    // --- Validate required fields ---
    const required = { name: 'お名前', email: 'メールアドレス', inquiry_type: '相談の種類', message: '内容' };
    for (const [field, label] of Object.entries(required)) {
      if (!data[field]?.toString().trim()) {
        return json({ error: `${label}を入力してください` }, 400);
      }
    }

    // --- Email format ---
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      return json({ error: '有効なメールアドレスを入力してください' }, 400);
    }

    // --- Rate-limit hint (basic: check CF-Connecting-IP via header) ---
    // Full rate limiting can be added via Cloudflare Workers KV if needed.

    // --- Send via Resend ---
    const apiKey = env.RESEND_API_KEY;
    if (!apiKey) {
      console.error('RESEND_API_KEY is not set');
      return json({ error: 'Server configuration error' }, 500);
    }

    const inquiryLabels = {
      workflow: '業務設計・業務フロー整理',
      ai:       'AI活用・業務への組み込み',
      tool:     '業務ツール設計・開発',
      web:      'LP / Web制作',
      other:    'その他',
    };
    const inquiryLabel = inquiryLabels[data.inquiry_type] || data.inquiry_type;

    const emailBody = [
      `【ポートフォリオサイトからの問い合わせ】`,
      ``,
      `お名前:       ${data.name}`,
      `会社・組織名: ${data.company || '（未入力）'}`,
      `メール:       ${data.email}`,
      `相談の種類:   ${inquiryLabel}`,
      ``,
      `内容:`,
      data.message,
      ``,
      `---`,
      `送信元: taichiokada.com お問い合わせフォーム`,
    ].join('\n');

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type':  'application/json',
      },
      body: JSON.stringify({
        from:     `${FROM_NAME} <${FROM_ADDRESS}>`,
        to:       [TO_ADDRESS],
        reply_to: data.email,
        subject:  `[お問い合わせ] ${inquiryLabel} — ${data.name}`,
        text:     emailBody,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error('Resend API error:', res.status, errText);
      return json({ error: 'メール送信に失敗しました。時間をおいて再度お試しください。' }, 500);
    }

    return json({ ok: true });

  } catch (err) {
    console.error('Contact handler error:', err);
    return json({ error: 'サーバーエラーが発生しました。' }, 500);
  }
}

// Handle OPTIONS preflight
export async function onRequestOptions() {
  return new Response(null, { headers: CORS_HEADERS });
}
