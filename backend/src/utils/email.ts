export async function sendAuthEmail(env: WorkerBindings, to: string, subject: string, text: string) {
  if (!env.MAILCHANNELS_API_KEY) {
    console.warn('Auth email delivery is not configured');
    return;
  }

  const response = await fetch('https://api.mailchannels.net/tx/v1/send', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Api-Key': env.MAILCHANNELS_API_KEY,
    },
    body: JSON.stringify({
      from: { email: 'noreply@flocka.net', name: 'Flocka' },
      personalizations: [{ to: [{ email: to }] }],
      subject,
      content: [{ type: 'text/plain', value: text }],
    }),
  });

  if (!response.ok) {
    throw new Error(`Auth email delivery failed: ${response.status}`);
  }
}
