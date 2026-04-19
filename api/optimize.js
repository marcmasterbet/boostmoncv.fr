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
        max_tokens: 1200,
        messages: [
          { role: 'system', content: 'Tu es un expert RH. Tu réponds UNIQUEMENT avec le contenu demandé, sans commentaires.' },
          {
            role: 'user',
            content: `Réécris ce CV pour le poste de "${poste}". 

CV original :
${cvText || 'Génère un CV type pour ce poste'}

IMPORTANT - Formate EXACTEMENT comme ceci, avec ces titres en majuscules :

NOM PRENOM
${poste}

PROFIL
2-3 phrases percutantes sur le candidat en lien avec le poste.

EXPÉRIENCES PROFESSIONNELLES
Titre du poste - Entreprise - Année
Description courte en 1-2 lignes maximum.

Titre du poste - Entreprise - Année
Description courte en 1-2 lignes maximum.

COMPÉTENCES
Compétence 1, Compétence 2, Compétence 3, Compétence 4, Compétence 5

FORMATION
Diplôme - Établissement - Année

LANGUES
Langue - Niveau

Règles strictes :
- PAS de puces, PAS d'étoiles, PAS de tirets en début de ligne
- Sections courtes et concises
- Maximum 1 page quand imprimé
- Mots-clés du poste ${poste} bien présents`
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
        max_tokens: 800,
        messages: [
          { role: 'system', content: 'Tu es un expert RH. Tu réponds UNIQUEMENT avec la lettre, sans commentaires.' },
          {
            role: 'user',
            content: `Rédige une lettre de motivation courte et percutante pour le poste de "${poste}" basée sur ce CV :

${cvText || 'Profil générique'}

Règles :
- Exactement 3 paragraphes courts
- Commence par "Madame, Monsieur,"
- Termine par "Veuillez agréer, Madame, Monsieur, l'expression de mes salutations distinguées."
- Ton professionnel et dynamique
- Maximum 250 mots
- PAS de puces ni d'étoiles`
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
      cvOptimise: `Erreur lors de la génération. Veuillez réessayer.`,
      lettre: `Erreur lors de la génération. Veuillez réessayer.`
    });
  }
}
