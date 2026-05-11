export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { cvText, poste } = req.body;
  if (!poste) return res.status(400).json({ error: 'Poste manquant' });

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
        messages: [
          {
            role: 'system',
            content: `Tu es un expert RH senior avec 20 ans d'expérience en recrutement en France. Tu analyses des CV avec précision et professionnalisme. Tu réponds UNIQUEMENT en JSON valide, sans texte avant ou après. Tu es strict sur la validation des métiers.`
          },
          {
            role: 'user',
            content: `Tu dois d'abord valider le poste, puis analyser le CV.

POSTE SOUMIS : "${poste}"
CV SOUMIS : ${cvText || 'CV non lisible'}

ÉTAPE 1 — VALIDATION DU POSTE :
Vérifie si "${poste}" est un vrai métier ou poste professionnel reconnu en France.
Exemples de postes VALIDES : Électricien, Comptable, Directeur commercial, Développeur, Infirmier, Cuisinier, Chauffeur, Architecte, etc.
Exemples de postes INVALIDES : chien, pizza, test, 123, insultes, mots sans sens, noms d'animaux, noms d'aliments, etc.

Si le poste est INVALIDE, réponds UNIQUEMENT avec ce JSON :
{
  "erreur": "poste_invalide",
  "message": "Le poste \"${poste}\" ne correspond pas à un métier reconnu. Veuillez saisir un intitulé de poste professionnel valide (ex: Comptable, Électricien, Développeur...)."
}

ÉTAPE 2 — ANALYSE DU CV (uniquement si poste valide) :
Analyse le CV pour le poste de "${poste}" et réponds avec ce JSON :
{
  "score": <nombre entre 40 et 90, calculé objectivement selon le CV et le poste, TOUJOURS identique pour le même CV et le même poste>,
  "critiques": [
    "<critique 1 : précise, personnalisée, basée sur le contenu réel du CV pour le poste ${poste}>",
    "<critique 2 : concrète et actionnable>",
    "<critique 3 : spécifique au secteur et au poste>",
    "<critique 4 : point d'amélioration prioritaire>"
  ]
}

RÈGLES IMPORTANTES :
- Le score doit refléter objectivement la qualité du CV pour ce poste
- Les critiques doivent être personnalisées et non génériques
- Ne jamais donner le même score par défaut
- Baser l'analyse sur le contenu réel du CV fourni`
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
      score: 55,
      critiques: [
        `Votre CV manque de mots-clés spécifiques au poste de ${poste}`,
        'Les expériences professionnelles manquent de résultats chiffrés et concrets',
        'La structure et la mise en page de votre CV peuvent être améliorées',
        'Les compétences techniques requises pour ce poste sont insuffisamment mises en avant'
      ]
    });
  }
}
