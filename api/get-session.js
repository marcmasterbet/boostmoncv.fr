const Stripe = require('stripe');
const fs = require('fs');
const path = require('path');

const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const { session_id, data_id } = req.query;
  if (!session_id || !data_id) return res.status(400).json({ error: 'Paramètres manquants' });

  try {
    const session = await stripe.checkout.sessions.retrieve(session_id);
    
    if (session.payment_status !== 'paid') {
      return res.status(402).json({ error: 'Paiement non complété' });
    }

    // Récupérer les données depuis /tmp
    const tmpPath = path.join('/tmp', `cv_${data_id}.json`);
    const data = JSON.parse(fs.readFileSync(tmpPath, 'utf8'));

    res.status(200).json({
      paid: true,
      cvText: data.cvText,
      poste: data.poste,
      score: data.score
    });
  } catch (error) {
    console.error('Session error:', error);
    res.status(500).json({ error: 'Erreur récupération session' });
  }
}
