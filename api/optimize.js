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
          { role: 'system', content: 'Tu es un expert RH et rédacteur de CV professionnel haut de gamme. Tu crées des CV complets, détaillés et percutants.' },
          {
            role: 'user',
            content: `Réécris et optimise en profondeur ce CV pour le poste de "${poste}".

CV original :
${cvText}

INSTRUCTIONS IMPORTANTES :
- Garde TOUTES les informations du CV original (expériences, dates, entreprises, formations, compétences, langues)
- Enrichis et développe chaque expérience avec des détails percutants et des verbes d'action forts
- Ajoute des résultats concrets et chiffrés quand possible
- Intègre les mots-clés importants pour le poste de ${poste}
- Le CV doit être COMPLET et DÉTAILLÉ, pas une version résumée

Format EXACT à respecter (titres en majuscules, pas de puces ni étoiles) :

NOM PRENOM
${poste}
Email | Téléphone | Ville

PROFIL PROFESSIONNEL
3-4 phrases percutantes qui valorisent le candidat pour le poste de ${poste}.

EXPÉRIENCES PROFESSIONNELLES

Titre du poste — Entreprise — Ville — Date début à Date fin
Description détaillée de 3-4 lignes minimum avec missions précises, responsabilités, résultats obtenus et compétences utilisées.

Titre du poste — Entreprise — Ville — Date début à Date fin  
Description détaillée de 3-4 lignes minimum.

COMPÉTENCES CLÉS
Compétence 1, Compétence 2, Compétence 3, Compétence 4, Compétence 5, Compétence 6, Compétence 7, Compétence 8

FORMATION

Diplôme — Établissement — Ville — Année
Description ou spécialité si pertinente.

LANGUES
Langue 1 — Niveau (ex: Courant, Intermédiaire, Notions)
Langue 2 — Niveau

CENTRES D'INTÉRÊT
Intérêt 1, Intérêt 2, Intérêt 3

RÈGLES STRICTES :
- AUCUNE puce, AUCUNE étoile, AUCUN tiret en début de ligne
- Texte riche et développé pour chaque expérience
- Minimum 400 mots au total
- Toutes les sections doivent être remplies avec les vraies infos du CV`
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
          { role: 'system', content: 'Tu es un expert RH. Tu rédiges des lettres de motivation professionnelles et percutantes.' },
          {
            role: 'user',
            content: `Rédige une lettre de motivation complète et professionnelle pour le poste de "${poste}" basée sur ce CV :

${cvText}

INSTRUCTIONS :
- Lettre complète de 4 paragraphes bien développés
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
