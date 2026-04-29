export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { cvText, poste, score } = req.body;
  if (!poste) return res.status(400).json({ error: 'Poste manquant' });

  const newScore = Math.min(score + Math.floor(Math.random() * 10) + 18, 95);

  try {
    const mainResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        max_tokens: 4000,
        messages: [
          {
            role: 'system',
            content: `Tu es le meilleur expert en recrutement en France avec 20 ans d'expérience. Tu analyses des CV avec une précision chirurgicale et fournis des recommandations ultra-pertinentes et actionnables. Tu réponds UNIQUEMENT en JSON valide.`
          },
          {
            role: 'user',
            content: `Analyse ce CV pour le poste de "${poste}" et réponds UNIQUEMENT en JSON valide avec ce format exact :

{
  "scoreATS": <nombre entre 40 et 85>,
  "analyseSections": {
    "experience": {"note": <0-10>, "commentaire": "<commentaire précis>"},
    "competences": {"note": <0-10>, "commentaire": "<commentaire précis>"},
    "formation": {"note": <0-10>, "commentaire": "<commentaire précis>"},
    "presentation": {"note": <0-10>, "commentaire": "<commentaire précis>"}
  },
  "motsClesManquants": ["<mot-clé 1>", "<mot-clé 2>", "<mot-clé 3>", "<mot-clé 4>", "<mot-clé 5>"],
  "comparaisonMarche": "<analyse en 3-4 phrases comparant le profil aux attentes du marché 2026 pour ${poste}>",
  "modifications": [
    {
      "ancien": "<texte exact du CV>",
      "nouveau": "<texte optimisé>",
      "pourquoi": "<explication courte>"
    }
  ],
  "phrasesAccroche": [
    "<phrase d'accroche version 1 - dynamique>",
    "<phrase d'accroche version 2 - expérience>",
    "<phrase d'accroche version 3 - compétences>"
  ],
  "competencesRecommandees": {
    "aMettre": ["<compétence présente dans le CV à mettre en avant>"],
    "aAjouter": ["<compétence à ajouter si possédée>"]
  },
  "questionsEntretien": [
    {"question": "<question>", "conseil": "<conseil pour y répondre>"},
    {"question": "<question>", "conseil": "<conseil>"},
    {"question": "<question>", "conseil": "<conseil>"},
    {"question": "<question>", "conseil": "<conseil>"},
    {"question": "<question>", "conseil": "<conseil>"}
  ]
}

CV ORIGINAL :
${cvText}

POSTE VISÉ : ${poste}

RÈGLES :
- scoreATS = score de compatibilité avec les filtres ATS des entreprises
- modifications : 6 à 8 modifications chirurgicales, les plus impactantes
- phrasesAccroche : 3 phrases de profil différentes et percutantes basées sur le vrai parcours
- questionsEntretien : les 5 questions les plus probables pour ${poste} avec conseils précis
- Ne jamais inventer expériences ou diplômes
- Tu PEUX suggérer des compétences cohérentes avec le parcours (indique-les dans aAjouter)`
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
        model: 'gpt-4o',
        max_tokens: 1500,
        messages: [
          {
            role: 'system',
            content: `Tu es un expert en rédaction de lettres de motivation. Tu rédiges des lettres percutantes et authentiques basées UNIQUEMENT sur les vraies informations du CV. Ton style est professionnel, dynamique et humain.`
          },
          {
            role: 'user',
            content: `Rédige une lettre de motivation EXCEPTIONNELLE pour le poste de "${poste}" basée sur ce CV :

${cvText}

STRUCTURE :
- "Madame, Monsieur,"
- Paragraphe 1 : Accroche PERCUTANTE — motivation sincère pour ${poste} + présentation du profil réel
- Paragraphe 2 : Expériences les plus pertinentes pour ${poste} avec faits concrets
- Paragraphe 3 : Compétences clés directement utiles pour ${poste} + valeur ajoutée unique
- Paragraphe 4 : Conclusion dynamique + disponibilité pour entretien
- "Veuillez agréer, Madame, Monsieur, l'expression de mes salutations distinguées."

RÈGLES :
- Minimum 400 mots
- Aucune puce ni étoile
- Basé UNIQUEMENT sur les vraies infos du CV`
          }
        ]
      })
    });

    const mainData = await mainResponse.json();
    const letterData = await letterResponse.json();

    const text = mainData.choices[0].message.content;
    const clean = text.replace(/```json|```/g, '').trim();
    const result = JSON.parse(clean);

    res.status(200).json({
      newScore,
      scoreATS: result.scoreATS,
      analyseSections: result.analyseSections,
      motsClesManquants: result.motsClesManquants,
      comparaisonMarche: result.comparaisonMarche,
      modifications: result.modifications,
      phrasesAccroche: result.phrasesAccroche,
      competencesRecommandees: result.competencesRecommandees,
      questionsEntretien: result.questionsEntretien,
      lettre: letterData.choices[0].message.content
    });

  } catch (error) {
    console.error('Optimize error:', error);
    res.status(500).json({
      newScore,
      scoreATS: 0,
      modifications: [],
      lettre: 'Erreur lors de la génération. Veuillez réessayer.'
    });
  }
}
