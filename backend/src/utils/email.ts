export async function sendAuthEmail(env: WorkerBindings, to: string, subject: string, text: string) {
  const from = env.RESEND_FROM_EMAIL?.trim();
  if (!env.RESEND_API_KEY || !from) {
    if (env.ENVIRONMENT === 'production') {
      throw new Error('RESEND_API_KEY and RESEND_FROM_EMAIL are required for auth email delivery');
    }
    return;
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
    },
    body: JSON.stringify({ from, to: [to], subject, text }),
    signal: AbortSignal.timeout(10000),
  });

  if (!response.ok) {
    throw new Error(`Resend rejected auth email: HTTP ${response.status}`);
  }
}
