export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { cvText, poste, score } = req.body;
  if (!poste) return res.status(400).json({ error: 'Poste manquant' });

  const newScore = Math.min(score + Math.floor(Math.random() * 10) + 18, 95);

  try {
    const cvResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        max_tokens: 1000,
        messages: [
          { role: 'system', content: 'Tu es un expert RH. Tu réponds UNIQUEMENT avec le contenu demandé, sans commentaires.' },
          {
            role: 'user',
            content: `Réécris et optimise ce CV pour le poste de "${poste}".

CV original :
${cvText || 'CV non lisible - génère un CV professionnel type pour ce poste'}

Règles :
- Ajoute les mots-clés importants pour le poste de ${poste}
- Améliore la formulation des expériences avec des verbes d'action
- Structure clairement : Profil / Expériences / Compétences / Formation
- Garde un ton professionnel et concis
- Réponds UNIQUEMENT avec le CV réécrit, sans commentaires.`
          }
        ]
      })
    });

    const letterResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        max_tokens: 1000,
        messages: [
          { role: 'system', content: 'Tu es un expert RH. Tu réponds UNIQUEMENT avec le contenu demandé, sans commentaires.' },
          {
            role: 'user',
            content: `Rédige une lettre de motivation professionnelle pour le poste de "${poste}" basée sur ce CV :

${cvText || 'Profil générique pour ce poste'}

Règles :
- Ton professionnel et chaleureux
- 3 paragraphes : accroche / compétences clés / motivation
- Personnalisée au poste de ${poste}
- Commence par "Madame, Monsieur,"
- Termine par une formule de politesse classique
- Réponds UNIQUEMENT avec la lettre, sans commentaires.`
          }
        ]
      })
    });

    const cvData = await cvResponse.json();
    const letterData = await letterResponse.json();

    res.status(200).json({
      newScore,
      cvOptimise: cvData.choices[0].message.content,
      lettre: letterData.choices[0].message.content
    });

  } catch (error) {
    console.error('Optimize error:', error);
    res.status(500).json({
      newScore,
      cvOptimise: `CV OPTIMISÉ — ${poste}\n\nErreur lors de la génération. Veuillez réessayer.`,
      lettre: `Madame, Monsieur,\n\nErreur lors de la génération. Veuillez réessayer.\n\nCordialement`
    });
  }
}
