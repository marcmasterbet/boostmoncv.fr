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
        max_tokens: 1000,
        messages: [
          {
            role: 'system',
            content: 'Tu es un expert RH qui analyse des CV. Tu réponds UNIQUEMENT en JSON valide, sans texte avant ou après.'
          },
          {
            role: 'user',
            content: `Analyse ce CV pour le poste de "${poste}".

CV fourni :
${cvText || 'CV non lisible (image ou format non supporté)'}

Réponds UNIQUEMENT en JSON valide avec ce format exact :
{
  "score": <nombre entre 58 et 74>,
  "critiques": [
    "<critique 1 précise et personnalisée par rapport au CV et au poste>",
    "<critique 2>",
    "<critique 3>",
    "<critique 4>"
  ]
}

Les critiques doivent être spécifiques au poste de ${poste} et au contenu du CV. Mentionne des éléments concrets manquants ou à améliorer. Ne sois pas générique.`
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
    res.status(500).json({
      score: 63,
      critiques: [
        `Les mots-clés spécifiques au poste de ${poste} sont insuffisants dans votre CV`,
        'Votre expérience professionnelle manque de détails et de résultats chiffrés',
        'La structure du CV ne correspond pas aux attentes des recruteurs du secteur',
        'Les compétences techniques liées au poste ne sont pas mises en avant'
      ]
    });
  }
}
