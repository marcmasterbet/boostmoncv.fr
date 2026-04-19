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
        max_tokens: 2000,
        messages: [
          { role: 'system', content: 'Tu es un expert RH et rédacteur de CV professionnel haut de gamme. Tu enrichis les CV existants sans jamais inventer d\'informations.' },
          {
            role: 'user',
            content: `Prends ce CV et améliore-le en profondeur pour le poste de "${poste}".

CV ORIGINAL À AMÉLIORER :
${cvText}

RÈGLES ABSOLUES :
- Garde EXACTEMENT toutes les informations du CV original (noms, entreprises, dates, diplômes, tout)
- N'invente RIEN qui n'est pas dans le CV original
- Enrichis chaque expérience avec des verbes d'action forts et des détails percutants
- Développe les descriptions qui sont trop courtes
- Ajoute des mots-clés pertinents pour le poste de ${poste}
- AUCUNE puce, AUCUNE étoile, AUCUN tiret en début de ligne

Format EXACT à respecter :

NOM PRENOM
${poste}
Email | Téléphone | Ville (si présents dans le CV original)

PROFIL PROFESSIONNEL
3-4 phrases percutantes basées sur le vrai profil du candidat.

EXPÉRIENCES PROFESSIONNELLES

Titre poste — Entreprise — Dates
Description enrichie de 3-4 lignes avec missions précises et résultats.

(répéter pour chaque expérience du CV original)

COMPÉTENCES CLÉS
Toutes les compétences du CV original enrichies et complétées.

FORMATION

Diplôme — Établissement — Année
(toutes les formations du CV original)

LANGUES
(toutes les langues du CV original avec niveaux)

CENTRES D'INTÉRÊT
(si présents dans le CV original)`
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
          { role: 'system', content: 'Tu es un expert RH. Tu rédiges des lettres de motivation professionnelles et percutantes basées uniquement sur les vraies informations du CV.' },
          {
            role: 'user',
            content: `Rédige une lettre de motivation complète et professionnelle pour le poste de "${poste}" basée sur ce CV :

${cvText}

INSTRUCTIONS :
- Utilise uniquement les vraies informations du CV
- 4 paragraphes bien développés
- Paragraphe 1 : accroche percutante et motivation pour le poste
- Paragraphe 2 : expériences clés et compétences en lien avec ${poste}
- Paragraphe 3 : valeur ajoutée et ce que le candidat apporte
- Paragraphe 4 : conclusion et disponibilité
- Commence par "Madame, Monsieur,"
- Termine par "Veuillez agréer, Madame, Monsieur, l'expression de mes salutations distinguées."
- Ton professionnel, dynamique et convaincant
- Minimum 300 mots
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
      cvOptimise: 'Erreur lors de la génération. Veuillez réessayer.',
      lettre: 'Erreur lors de la génération. Veuillez réessayer.'
    });
  }
}
