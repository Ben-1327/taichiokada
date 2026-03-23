/**
 * Cloudflare Pages Function — Contact form handler
 * POST /api/contact
 *
 * セットアップ手順:
 *   1. https://web3forms.com にアクセス
 *   2. taichi.o@oneddy.net を入力して "Create Access Key" をクリック
 *   3. メールで届いたアクセスキーをコピー
 *   4. Cloudflare Pages ダッシュボード
 *      → Settings → Environment variables → Add variable
 *      Name:  WEB3FORMS_KEY
 *      Value: （コピーしたキー）
 *   5. Deployments → Retry deployment
 */

const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  });
}

export async function onRequestPost({ request, env }) {
  try {
    // ── Parse body ──────────────────────────────────────────
    const ct = request.headers.get('Content-Type') || '';
    let data = {};

    if (ct.includes('application/json')) {
      data = await request.json();
    } else {
      // multipart/form-data or application/x-www-form-urlencoded
      const fd = await request.formData();
      for (const [k, v] of fd.entries()) data[k] = String(v);
    }

    // ── Honeypot (spam) ──────────────────────────────────────
    if (data._gotcha) return json({ ok: true }); // silently discard

    // ── Validate ─────────────────────────────────────────────
    const fields = {
      name:         'お名前',
      email:        'メールアドレス',
      inquiry_type: '相談の種類',
      message:      '内容',
    };
    for (const [key, label] of Object.entries(fields)) {
      if (!data[key]?.trim()) {
        return json({ error: `${label}を入力してください` }, 400);
      }
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      return json({ error: '有効なメールアドレスを入力してください' }, 400);
    }

    // ── API key ───────────────────────────────────────────────
    const accessKey = env.WEB3FORMS_KEY;
    if (!accessKey) {
      console.error('[contact] WEB3FORMS_KEY is not set in environment variables');
      return json({ error: 'サーバー設定エラーです。管理者にご連絡ください。' }, 500);
    }

    // ── Build message ─────────────────────────────────────────
    const inquiryLabels = {
      workflow: '業務設計・業務フロー整理',
      ai:       'AI活用・業務への組み込み',
      tool:     '業務ツール設計・開発',
      web:      'LP / Web制作',
      other:    'その他・まだ決まっていない',
    };
    const inquiryLabel = inquiryLabels[data.inquiry_type] || data.inquiry_type;

    const message = [
      `お名前:       ${data.name}`,
      `会社・組織名: ${data.company || '（未入力）'}`,
      `メール:       ${data.email}`,
      `相談の種類:   ${inquiryLabel}`,
      '',
      '内容:',
      data.message,
      '',
      '---',
      '送信元: taichiokada.com お問い合わせフォーム',
    ].join('\n');

    // ── Send via Web3Forms ────────────────────────────────────
    const res = await fetch('https://api.web3forms.com/submit', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        access_key: accessKey,
        subject:    `[お問い合わせ] ${inquiryLabel} — ${data.name}`,
        from_name:  data.name,
        replyto:    data.email,
        message,
      }),
    });

    const result = await res.json().catch(() => ({}));

    if (!result.success) {
      console.error('[contact] Web3Forms error:', res.status, JSON.stringify(result));
      return json({ error: '送信に失敗しました。時間をおいて再度お試しください。' }, 502);
    }

    return json({ ok: true });

  } catch (err) {
    console.error('[contact] Unhandled error:', err);
    return json({ error: 'サーバーエラーが発生しました。' }, 500);
  }
}

// OPTIONS preflight (CORS)
export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: CORS });
}
