
import { GoogleGenAI, Type } from "@google/genai";
import { AISuggestion } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Pomocná funkce pro vyčištění JSONu od markdown bloků
const parseSafeJson = (text: string | undefined): any => {
  if (!text) return {};
  try {
    const cleaned = text.replace(/```json\n?|```/g, '').trim();
    return JSON.parse(cleaned);
  } catch (e) {
    console.error("Chyba při parsování AI odpovědi:", e, text);
    throw new Error("Neplatný formát odpovědi od AI");
  }
};

export const summarizeNoteWithAI = async (title: string, content: string): Promise<string> => {
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Vytvoř velmi stručné, věcné a výstižné shrnutí (maximálně jedna věta) pro následující poznámku. 
      Vrať pouze čistý text shrnutí bez uvozovek a uvození.
      
      Název: ${title}
      Obsah: ${content}`,
  });
  return response.text?.trim() || "";
};

export const improveNoteWithAI = async (title: string, content: string, existingCategories: string[]): Promise<AISuggestion> => {
  const categoriesList = existingCategories.length > 0 ? existingCategories.join(', ') : "Žádné zatím nejsou definovány";

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Jsi profesionální editor poznámek. Analyzuj a vylepši následující text.
      1. Vytvoř krátké shrnutí (jedna věta).
      2. Oprav gramatiku a stylistiku v češtině.
      3. Navrhni vylepšený, výstižný a atraktivní název poznámky (v poli 'suggestedTitle'). Pokud je stávající název prázdný, vygeneruj ho z obsahu.
      4. Vyber nejvhodnější štítky POUZE ze seznamu existujících kategorií níže.
      5. Pokud žádná z existujících kategorií není vhodná, navrhni JEDEN nový název v poli 'newCategoryRecommendation', ale NEPŘIDÁVEJ ho do 'suggestedCategories'.
      
      EXISTUJÍCÍ KATEGORIE: [${categoriesList}]

      Stávající název: ${title || '(prázdný)'}
      Obsah: ${content}`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          summary: { type: Type.STRING },
          improvedText: { type: Type.STRING },
          suggestedTitle: { type: Type.STRING, description: "Vylepšený nebo nově vygenerovaný název poznámky." },
          suggestedCategories: { 
            type: Type.ARRAY, 
            items: { type: Type.STRING },
            description: "Seznam kategorií vybraných VÝHRADNĚ z poskytnutého seznamu existujících kategorií."
          },
          newCategoryRecommendation: { 
            type: Type.STRING,
            description: "Návrh na úplně novou kategorii, pokud žádná stávající nevyhovuje."
          },
        },
        required: ["summary", "improvedText", "suggestedTitle", "suggestedCategories"]
      }
    }
  });

  return parseSafeJson(response.text);
};

export const verifyFactsWithAI = async (content: string): Promise<string> => {
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: `Ověř fakta v následujícím textu pomocí vyhledávání Google. Upozorni na chyby a uveď zdroje.
    
    Text k ověření: ${content}`,
    config: {
      tools: [{ googleSearch: {} }],
    },
  });

  let text = response.text || "Nepodařilo se ověřit fakta.";
  const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
  
  if (sources.length > 0) {
    text += "\n\n**Zdroje:**\n" + sources
      .filter(s => s.web?.uri)
      .map((s: any) => `- [${s.web?.title || 'Zdroj'}](${s.web?.uri})`)
      .join('\n');
  }

  return text;
};

export const translateNoteWithAI = async (title: string, content: string, targetLanguage: string): Promise<{ title: string, content: string }> => {
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Přelož název a obsah poznámky do jazyka: ${targetLanguage}. 
      Zachovej tón a formátování textu.
      
      Název: ${title}
      Obsah: ${content}`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          content: { type: Type.STRING },
        },
        required: ["title", "content"]
      }
    }
  });

  return parseSafeJson(response.text);
};
