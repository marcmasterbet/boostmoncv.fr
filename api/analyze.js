export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { cvText, poste } = req.body;
  if (!poste) return res.status(400).json({ error: 'Poste manquant' });

  // Vérification CV vide ou trop court
  const cvWords = (cvText || '').trim().split(/\s+/).filter(w => w.length > 1);
  if (cvWords.length < 50) {
    return res.status(200).json({
      score: Math.floor(Math.random() * 10) + 20, // Score entre 20 et 30
      critiques: [
        'Votre CV est trop court ou incomplet pour être analysé correctement. Un CV professionnel doit contenir au minimum une expérience, une formation et des compétences détaillées.',
        'Aucune expérience professionnelle détectable dans le document fourni. Les recruteurs attendent un historique clair de vos missions et réalisations.',
        'Les compétences techniques et soft skills sont absentes ou insuffisantes. Un CV efficace doit lister au minimum 5 à 10 compétences clés pour le poste visé.',
        'La structure de votre CV ne répond pas aux standards attendus par les recruteurs en 2026. Pensez à inclure : accroche, expériences, formations, compétences et coordonnées.'
      ]
    });
  }

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
        temperature: 0.1, // Température très basse = résultats plus cohérents et stables
        messages: [
          {
            role: 'system',
            content: `Tu es un expert RH senior avec 20 ans d'expérience en recrutement en France. Tu analyses des CV avec précision et professionnalisme. Tu réponds UNIQUEMENT en JSON valide, sans texte avant ou après. Tu es strict sur la validation des métiers et la qualité des CV.`
          },
          {
            role: 'user',
            content: `Tu dois d'abord valider le poste, puis analyser le CV.

POSTE SOUMIS : "${poste}"
CV SOUMIS : ${cvText}

ÉTAPE 1 — VALIDATION DU POSTE :
Vérifie si "${poste}" est un vrai métier ou poste professionnel reconnu en France.
Exemples VALIDES : Électricien, Comptable, Directeur commercial, Développeur, Infirmier, Cuisinier, Chauffeur, Architecte, Commercial, Manager, etc.
Exemples INVALIDES : chien, pizza, test, 123, insultes, mots sans sens, noms d'animaux, noms d'aliments, prénoms seuls, etc.

Si le poste est INVALIDE, réponds UNIQUEMENT avec :
{
  "erreur": "poste_invalide",
  "message": "Le poste \"${poste}\" ne correspond pas à un métier reconnu. Veuillez saisir un intitulé de poste professionnel valide (ex: Comptable, Électricien, Développeur...)."
}

ÉTAPE 2 — ANALYSE DU CV (uniquement si poste valide) :
Analyse le CV de façon objective et stricte pour le poste de "${poste}".

RÈGLES DE SCORING STRICTES :
- Score 20-35 : CV vide, charabia, ou moins de 50 mots réels
- Score 36-50 : CV très incomplet, peu d'expériences, pas adapté au poste
- Score 51-65 : CV moyen, quelques expériences mais manques importants
- Score 66-75 : Bon CV avec des lacunes pour ce poste spécifique
- Score 76-85 : Très bon CV, bien adapté au poste
- Score 86-95 : CV excellent, parfaitement adapté

IMPORTANT : Le score doit être DÉTERMINISTE — le même CV pour le même poste doit toujours donner le même score. Base-toi uniquement sur le contenu réel du CV.

Réponds avec ce JSON :
{
  "score": <nombre calculé selon les règles ci-dessus>,
  "critiques": [
    "<critique 1 : précise et basée sur le contenu RÉEL du CV pour le poste ${poste}>",
    "<critique 2 : concrète et actionnable>",
    "<critique 3 : spécifique au secteur>",
    "<critique 4 : point d'amélioration prioritaire>"
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

    if (result.erreur === 'poste_invalide') {
      return res.status(400).json({ erreur: 'poste_invalide', message: result.message });
    }

    res.status(200).json(result);

  } catch (error) {
    console.error('Analyze error:', error);
    res.status(500).json({
      score: 42,
      critiques: [
        `Votre CV manque de mots-clés spécifiques au poste de ${poste}`,
        'Les expériences professionnelles manquent de résultats chiffrés et concrets',
        'La structure et la mise en page de votre CV peuvent être améliorées',
        'Les compétences techniques requises pour ce poste sont insuffisamment mises en avant'
      ]
    });
  }
}
