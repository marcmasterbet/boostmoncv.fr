const Stripe = require('stripe');
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { cvText, poste, score } = req.body;

  try {
    // Tronquer le CV à 500 chars max pour Stripe metadata
    const cvTrunc = (cvText || '').substring(0, 490);

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'eur',
          product_data: {
            name: 'CV Optimisé + Rapport complet',
            description: `Optimisation pour le poste de ${poste}`,
          },
          unit_amount: 299,
        },
        quantity: 1,
      }],
      mode: 'payment',
      success_url: `${req.headers.origin}/success.html?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.origin}/`,
      metadata: { 
        cvText: cvTrunc,
        poste: poste,
        score: String(score)
      }
    });

    res.status(200).json({ url: session.url });
  } catch (error) {
    console.error('Stripe error:', error);
    res.status(500).json({ error: 'Erreur paiement' });
  }
}
