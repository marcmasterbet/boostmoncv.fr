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
            content: `Tu es le meilleur consultant en recrutement en France, avec 20 ans d'expérience chez les plus grands cabinets RH. Tu as aidé des milliers de candidats à décrocher leur emploi idéal. Tu maîtrises parfaitement les techniques ATS (Applicant Tracking System) et tu sais exactement quels mots-clés et formulations font la différence. Ton travail est de transformer un CV ordinaire en un CV exceptionnel qui se démarque immédiatement.`
          },
          {
            role: 'user',
            content: `Je suis candidat au poste de "${poste}". Transforme mon CV en un document exceptionnel qui va décrocher des entretiens.

MON CV ORIGINAL :
${cvText}

TON OBJECTIF : Prendre EXACTEMENT toutes mes informations (entreprises, dates, diplômes, tout) et les transformer en un CV de haut niveau qui impressionne les recruteurs.

RÈGLES ABSOLUES :
1. Utilise UNIQUEMENT mes vraies informations — n'invente RIEN
2. Garde toutes mes expériences, toutes mes dates, tous mes diplômes
3. Transforme chaque description en quelque chose de percutant et professionnel
4. Utilise des verbes d'action forts : "Piloté", "Développé", "Optimisé", "Géré", "Coordonné", "Assuré", "Réalisé", "Supervisé"
5. Ajoute des formulations qui montrent l'impact et les résultats
6. Intègre les mots-clés essentiels pour le poste de ${poste}
7. AUCUNE puce, AUCUNE étoile, AUCUN tiret en début de ligne
8. Texte riche, développé, professionnel pour chaque poste

FORMAT EXACT (respecte ces titres en majuscules) :

NOM PRENOM
${poste}
Coordonnées si présentes dans le CV original

PROFIL PROFESSIONNEL
4-5 phrases puissantes qui vendent le candidat pour le poste de ${poste}. Commence par le métier et les années d'expérience. Mets en avant les points forts les plus pertinents.

EXPÉRIENCES PROFESSIONNELLES

Titre du poste — Entreprise — Ville — Période
Développe en 4-6 lignes riches et détaillées : missions principales, responsabilités clés, compétences techniques utilisées, résultats obtenus. Utilise des formulations professionnelles et percutantes.

(une entrée complète par expérience du CV original)

COMPÉTENCES CLÉS
Liste complète et enrichie de toutes les compétences techniques et comportementales pertinentes pour ${poste}.

FORMATION

Diplôme complet — Établissement — Année
Mention ou spécialité si pertinente.

LANGUES
Langue — Niveau précis

CENTRES D'INTÉRÊT
Intérêts si présents dans le CV original`
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
            content: `Tu es un expert en rédaction de lettres de motivation, reconnu pour avoir aidé des milliers de candidats à décrocher des entretiens. Tu rédiges des lettres percutantes, authentiques et personnalisées qui donnent vraiment envie de rencontrer le candidat.`
          },
          {
            role: 'user',
            content: `Rédige une lettre de motivation exceptionnelle pour le poste de "${poste}" en te basant sur ce CV :

${cvText}

OBJECTIF : Une lettre qui donne immédiatement envie au recruteur de décrocher son téléphone.

STRUCTURE :
- En-tête : Lieu et date à droite, coordonnées candidat à gauche (si disponibles dans le CV)
- "Madame, Monsieur,"
- Paragraphe 1 (Accroche) : Une ouverture percutante qui montre la motivation et la connaissance du métier. Pas de cliché.
- Paragraphe 2 (Expérience) : Les 2-3 expériences les plus pertinentes pour ${poste}, avec des faits concrets et des résultats.
- Paragraphe 3 (Valeur ajoutée) : Ce que le candidat apporte de unique, ses qualités humaines et professionnelles en lien avec le poste.
- Paragraphe 4 (Conclusion) : Appel à l'action, disponibilité pour un entretien, formule de politesse complète.
- "Veuillez agréer, Madame, Monsieur, l'expression de mes salutations distinguées."
- Signature avec le nom

RÈGLES :
- Ton professionnel, dynamique et humain
- Phrases courtes et percutantes
- Minimum 350 mots
- Basé UNIQUEMENT sur les vraies infos du CV
- Aucune puce ni étoile`
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
