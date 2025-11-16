// This example uses the Google Translate API endpoint for transliteration.
// You must have an API key (replace YOUR_API_KEY).

// Supported Indian languages and codes
export const SUPPORTED_LANGUAGES = [
  'en', 'hi', 'ta', 'te', 'ka', 'ml', 'mr', 'gu', 'pa', 'bn', 'or', 'ur'
];

export async function translateName(name, targetLang) {
  if (targetLang === 'en') return name;

  try {
    // Use Google Cloud Translate API for transliteration.
    // Adjust URL if you use a different provider.
    const apiKey = 'AIzaSyA3C7ajLXP3lgm45aC0OR-kbxn6K4pNBFk';
    const url = `https://translation.googleapis.com/language/translate/v2?key=${apiKey}`;

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        q: name,
        target: targetLang,
        format: 'text',
        model: 'nmt' // neural machine translation (better for transliteration)
      })
    });

    const data = await res.json();
    if (data && data.data && data.data.translations && data.data.translations[0].translatedText) {
      return data.data.translations[0].translatedText;
    }

    return name; // fallback to input name
  } catch (e) {
    console.error('Name translation error:', e);
    return name;
  }
}

// Get translations for all languages at once
export async function getAllLanguageNames(name) {
  const translationPromises = SUPPORTED_LANGUAGES.map(lang =>
    translateName(name, lang)
      .then(translated => ({ lang, value: translated }))
      .catch(() => ({ lang, value: name }))
  );
  const translations = await Promise.all(translationPromises);
  // Returns: { en: "Ramesh", hi: "रमेश", ta: "ரமேஷ்", ... }
  return Object.fromEntries(translations.map(obj => [obj.lang, obj.value]));
}

// Usage Example:
// const allNames = await getAllLanguageNames("Ramesh");
// allNames["hi"] → "रमेश", allNames["ta"] → "ரமேஷ்"
