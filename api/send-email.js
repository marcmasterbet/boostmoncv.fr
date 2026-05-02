export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { email, lettre, poste } = req.body;
  if (!email || !lettre) return res.status(400).json({ error: 'Données manquantes' });

  try {
    const response = await fetch('https://send.api.mailtrap.io/api/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.MAILTRAP_API_KEY}`
      },
      body: JSON.stringify({
        from: { email: 'noreply@boostmoncv.fr', name: 'BoostMonCV' },
        to: [{ email: email }],
        subject: `🚀 Votre lettre de motivation — ${poste}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #0a0f2e, #FF6B1A); padding: 30px; text-align: center; border-radius: 12px 12px 0 0;">
              <h1 style="color: white; margin: 0; font-size: 24px;">🚀 BoostMonCV</h1>
              <p style="color: rgba(255,255,255,0.8); margin: 8px 0 0;">Votre lettre de motivation est prête !</p>
            </div>
            <div style="background: #f4f6f9; padding: 30px; border-radius: 0 0 12px 12px;">
              <h2 style="color: #0a0f2e;">Bonjour !</h2>
              <p style="color: #6b7280;">Voici votre lettre de motivation pour le poste de <strong style="color: #FF6B1A;">${poste}</strong>.</p>
              <p style="color: #6b7280;">Vous trouverez votre lettre complète ci-dessous ainsi qu'en pièce jointe au format texte.</p>
              <div style="background: white; border-radius: 8px; padding: 20px; margin: 20px 0; border-left: 4px solid #FF6B1A; white-space: pre-wrap; font-size: 14px; color: #374151; line-height: 1.7;">${lettre}</div>
              <p style="color: #9ca3af; font-size: 12px; text-align: center; margin-top: 20px;">© 2026 BoostMonCV — boostmoncv.fr</p>
            </div>
          </div>
        `,
        attachments: [
          {
            filename: `Lettre_motivation_${poste.replace(/\s/g, '_')}.txt`,
            content: Buffer.from(lettre, 'utf-8').toString('base64'),
            type: 'text/plain',
            disposition: 'attachment'
          }
        ]
      })
    });

    if(response.ok) {
      res.status(200).json({ success: true });
    } else {
      const err = await response.json();
      console.error('Mailtrap error:', err);
      res.status(500).json({ error: 'Erreur envoi email' });
    }
  } catch (error) {
    console.error('Email error:', error);
    res.status(500).json({ error: 'Erreur envoi email' });
  }
}
