const Stripe = require('stripe');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { cvText, poste, score } = req.body;

  try {
    // Générer un ID unique pour stocker les données
    const dataId = crypto.randomUUID();
    
    // Sauvegarder dans /tmp
    const tmpPath = path.join('/tmp', `cv_${dataId}.json`);
    fs.writeFileSync(tmpPath, JSON.stringify({ cvText, poste, score }));

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
      success_url: `${req.headers.origin}/success.html?session_id={CHECKOUT_SESSION_ID}&data_id=${dataId}`,
      cancel_url: `${req.headers.origin}/`,
      metadata: { data_id: dataId, poste, score: String(score) }
    });

    res.status(200).json({ url: session.url });
  } catch (error) {
    console.error('Stripe error:', error);
    res.status(500).json({ error: 'Erreur paiement' });
  }
}
