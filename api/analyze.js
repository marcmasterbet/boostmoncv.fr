export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { cvText, poste } = req.body;
  if (!poste) return res.status(400).json({ error: 'Poste manquant' });

  // ÉTAPE 1 — Vérifier le poste séparément
  try {
    const posteCheck = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        max_tokens: 100,
        temperature: 0,
        messages: [
          {
            role: 'system',
            content: 'Tu réponds UNIQUEMENT par "oui" ou "non" sans rien d\'autre.'
          },
          {
            role: 'user',
            content: `Est-ce que "${poste}" est un vrai métier ou poste professionnel reconnu en France ? Réponds uniquement "oui" ou "non".`
          }
        ]
      })
    });

    const posteData = await posteCheck.json();
    const posteReponse = posteData.choices[0].message.content.trim().toLowerCase();

    if (posteReponse.includes('non')) {
      return res.status(400).json({
        erreur: 'poste_invalide',
        message: `Le poste "${poste}" ne correspond pas à un métier reconnu. Veuillez saisir un intitulé de poste professionnel valide (ex: Comptable, Électricien, Développeur...).`
      });
    }

  } catch(e) {
    console.error('Erreur validation poste:', e);
    // Si erreur validation, on continue quand même
  }

  // ÉTAPE 2 — Vérifier le CV
  const cvWords = (cvText || '').trim().split(/\s+/).filter(w => w.length > 1);
  if (cvWords.length < 50) {
    return res.status(200).json({
      score: 22,
      critiques: [
        'Votre CV est trop court ou incomplet. Un CV professionnel doit contenir au minimum une expérience, une formation et des compétences détaillées.',
        'Aucune expérience professionnelle détectable. Les recruteurs attendent un historique clair de vos missions et réalisations.',
        'Les compétences techniques et soft skills sont absentes. Un CV efficace doit lister au minimum 5 à 10 compétences clés pour le poste visé.',
        'La structure de votre CV ne répond pas aux standards 2026. Incluez : accroche, expériences, formations, compétences et coordonnées.'
      ]
    });
  }

  // ÉTAPE 3 — Analyser le CV
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        max_tokens: 1200,
        temperature: 0.1,
        messages: [
          {
            role: 'system',
            content: `Tu es un expert RH senior avec 20 ans d'expérience en recrutement en France. Tu analyses des CV avec précision. Tu réponds UNIQUEMENT en JSON valide, sans texte avant ou après.`
          },
          {
            role: 'user',
            content: `Analyse ce CV pour le poste de "${poste}" et réponds UNIQUEMENT en JSON :

CV :
${cvText}

RÈGLES DE SCORING :
- Score 20-35 : CV très incomplet ou inadapté
- Score 36-50 : CV incomplet, peu d'expériences
- Score 51-65 : CV moyen avec manques importants
- Score 66-75 : Bon CV avec lacunes pour ce poste
- Score 76-85 : Très bon CV, bien adapté
- Score 86-95 : CV excellent

{
  "score": <nombre selon les règles ci-dessus, basé UNIQUEMENT sur le contenu réel du CV>,
  "critiques": [
    "<critique 1 précise basée sur le CV réel pour ${poste}>",
    "<critique 2 concrète et actionnable>",
    "<critique 3 spécifique au secteur>",
    "<critique 4 point d'amélioration prioritaire>"
  ]
}`
          }
        ]
      })
    });

    const data = await response.json();
    const text = data.choices[0].message.content;
    const clean = text.replace(/```json|```/g, '').trim();
    const result = JSON.parse(clean);
    res.status(200).json(result);

  } catch (error) {
    console.error('Analyze error:', error);
    res.status(200).json({
      score: 45,
      critiques: [
        `Votre CV manque de mots-clés spécifiques au poste de ${poste}`,
        'Les expériences professionnelles manquent de résultats chiffrés et concrets',
        'La structure de votre CV peut être améliorée',
        'Les compétences techniques requises pour ce poste sont insuffisamment mises en avant'
      ]
    });
  }
}
