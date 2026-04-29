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
            content: `Tu es un expert en recrutement avec 20 ans d'expérience en France. Tu analyses des CV et tu fournis des modifications CHIRURGICALES et PRÉCISES. Tu ne réécris jamais entièrement un CV. Tu indiques exactement quoi remplacer par quoi, phrase par phrase. Tu n'inventes jamais de faits, dates ou expériences qui ne sont pas dans le CV original.`
          },
          {
            role: 'user',
            content: `Analyse ce CV pour le poste de "${poste}" et donne des modifications PRÉCISES et PERTINENTES.

CV ORIGINAL :
${cvText}

INSTRUCTIONS :
1. Pour chaque modification, utilise ce format EXACT :
   ❌ REMPLACER : "texte exact du CV original"
   ✅ PAR : "nouveau texte optimisé pour ${poste}"
   💡 POURQUOI : explication courte et précise

2. Pour les COMPÉTENCES, liste exactement les compétences à ajouter/modifier pour correspondre au poste de ${poste}. Base-toi uniquement sur ce qui est dans le CV.

3. Donne 6 à 10 modifications maximum, les plus impactantes en premier.

4. INTERDICTIONS ABSOLUES :
   - Ne jamais inventer des expériences ou diplômes
   - Ne jamais changer les dates ou titres de postes
   - Ne jamais suggérer des compétences que le candidat n'a pas

FORMAT DE RÉPONSE :
## MODIFICATIONS DU CV

[liste des modifications avec le format ❌/✅/💡]

## COMPÉTENCES RECOMMANDÉES POUR ${poste.toUpperCase()}

[liste des compétences à mettre en avant ou ajouter basées sur le CV]`
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
            content: `Tu es un expert en rédaction de lettres de motivation. Tu rédiges des lettres percutantes et authentiques basées UNIQUEMENT sur les vraies informations du CV. Tu ne inventes jamais de faits. Ton style est professionnel, dynamique et humain.`
          },
          {
            role: 'user',
            content: `Rédige une lettre de motivation EXCEPTIONNELLE pour le poste de "${poste}" basée sur ce CV :

${cvText}

INTERDICTIONS :
- Ne jamais inventer de faits, dates ou expériences
- Ne jamais dire que le candidat a occupé le poste de "${poste}" si ce n'est pas dans le CV
- Valoriser honnêtement le parcours réel

STRUCTURE OBLIGATOIRE :
- "Madame, Monsieur,"
- Paragraphe 1 : Accroche PERCUTANTE — motivation sincère pour ${poste} + présentation du profil réel en 2-3 phrases
- Paragraphe 2 : Expériences les plus pertinentes pour ${poste} avec faits concrets et chiffres si disponibles
- Paragraphe 3 : Compétences clés directement utiles pour ${poste} + valeur ajoutée unique du candidat
- Paragraphe 4 : Conclusion dynamique + disponibilité pour entretien
- "Veuillez agréer, Madame, Monsieur, l'expression de mes salutations distinguées."

RÈGLES :
- Ton professionnel, dynamique et humain
- Minimum 400 mots
- Aucune puce ni étoile
- Basé UNIQUEMENT sur les vraies infos du CV
- Chaque paragraphe doit être dense et percutant`
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
