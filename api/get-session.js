const Stripe = require('stripe');
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const { session_id } = req.query;
  if (!session_id) return res.status(400).json({ error: 'Session ID manquant' });

  try {
    const session = await stripe.checkout.sessions.retrieve(session_id);
    
    if (session.payment_status !== 'paid') {
      return res.status(402).json({ error: 'Paiement non complété' });
    }

    res.status(200).json({
      paid: true,
      cvText: session.metadata.cvText,
      poste: session.metadata.poste,
      score: parseInt(session.metadata.score)
    });
  } catch (error) {
    console.error('Session error:', error);
    res.status(500).json({ error: 'Erreur récupération session' });
  }
}
