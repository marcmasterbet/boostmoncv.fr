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
        model: 'gpt-4o',
        max_tokens: 3000,
        messages: [
          {
            role: 'system',
            content: `Tu es le meilleur consultant en recrutement en France, avec 20 ans d'expérience. Tu transformes les CV existants sans JAMAIS inventer de faits, dates, titres ou années d'expérience. Tu enrichis uniquement le style et les formulations, jamais les faits. Si le candidat a 5 ans d'expérience dans le CV, tu écris 5 ans — jamais plus. Tu ne changes JAMAIS les titres de poste du CV original.`
          },
          {
            role: 'user',
            content: `Je postule au poste de "${poste}". Optimise mon CV pour ce poste en valorisant au maximum mon profil réel.

MON CV ORIGINAL :
${cvText}

INTERDICTIONS ABSOLUES :
- Ne JAMAIS inventer des années d'expérience qui ne sont pas dans le CV
- Ne JAMAIS changer mes titres de postes passés
- Ne JAMAIS inventer des responsabilités qui ne sont pas dans le CV
- Ne JAMAIS écrire que j'ai été "${poste}" si ce n'est pas dans mon CV
- Enrichir UNIQUEMENT les formulations et le style, jamais les faits

CE QUE TU PEUX FAIRE :
- Reformuler les descriptions avec des verbes d'action forts
- Mettre en avant les compétences pertinentes pour ${poste}
- Développer les missions avec un style professionnel
- Ajouter des mots-clés pertinents pour ${poste} dans le profil et les compétences
- Rendre le profil professionnel percutant en lien avec ${poste}

FORMAT EXACT :

NOM PRENOM
Candidature au poste de ${poste}
Coordonnées si présentes dans le CV original

PROFIL PROFESSIONNEL
4-5 phrases qui valorisent honnêtement le profil du candidat pour le poste de ${poste}. Basé uniquement sur ce qui est dans le CV.

EXPÉRIENCES PROFESSIONNELLES

Titre exact du poste — Entreprise — Dates exactes du CV
Description enrichie en 4-6 lignes : missions réelles développées avec style professionnel, verbes d'action, compétences utilisées. Tout basé sur le CV original.

(répéter pour chaque expérience du CV original)

COMPÉTENCES CLÉS
Compétences réelles du CV enrichies et complétées avec les compétences pertinentes pour ${poste}.

FORMATION

Diplôme exact — Établissement — Année exacte

LANGUES
Langues exactes du CV avec niveaux

CENTRES D'INTÉRÊT
Si présents dans le CV original uniquement`
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
            content: `Tu es un expert en rédaction de lettres de motivation. Tu rédiges des lettres percutantes et authentiques basées UNIQUEMENT sur les vraies informations du CV. Tu ne inventes jamais de faits.`
          },
          {
            role: 'user',
            content: `Rédige une lettre de motivation exceptionnelle pour le poste de "${poste}" basée sur ce CV :

${cvText}

INTERDICTIONS :
- Ne jamais inventer de faits, dates ou expériences
- Ne jamais dire que le candidat a occupé le poste de "${poste}" si ce n'est pas dans le CV
- Valoriser honnêtement le parcours réel pour montrer que le candidat est prêt pour ce poste

STRUCTURE :
- "Madame, Monsieur,"
- Paragraphe 1 : Accroche percutante — motivation pour le poste de ${poste} et brève présentation du profil réel
- Paragraphe 2 : Expériences les plus pertinentes du CV pour ${poste}, avec faits concrets
- Paragraphe 3 : Compétences clés et valeur ajoutée pour ce poste
- Paragraphe 4 : Conclusion, disponibilité pour un entretien
- "Veuillez agréer, Madame, Monsieur, l'expression de mes salutations distinguées."

RÈGLES :
- Ton professionnel, dynamique et humain
- Minimum 350 mots
- Aucune puce ni étoile
- Basé UNIQUEMENT sur les vraies infos du CV`
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
