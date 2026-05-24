import { cbseLanguageNames } from "./cbse-language-catalog";
import { getIndiaStateSuggestion, indiaStateOptions } from "./india-state-catalog";

export const languageOptions = cbseLanguageNames;
export const stateOptions = indiaStateOptions;

export type StateLanguageSuggestion = {
  suggestedRegionalLanguage: string;
  suggestionText: string;
};

export const stateLanguageCatalog: Record<string, StateLanguageSuggestion> = {
  Karnataka: {
    suggestedRegionalLanguage: "Kannada",
    suggestionText: "Kannada may be available as R2/R3 in Karnataka schools. Please select the final languages based on your school.",
  },
  "Andhra Pradesh": {
    suggestedRegionalLanguage: "Telugu",
    suggestionText: "Telugu may be available as R2/R3 in Andhra Pradesh schools. Please select the final languages based on your school.",
  },
  Telangana: {
    suggestedRegionalLanguage: "Telugu",
    suggestionText: "Telugu may be available as R2/R3 in Telangana schools. Please select the final languages based on your school.",
  },
  "Tamil Nadu": {
    suggestedRegionalLanguage: "Tamil",
    suggestionText: "Tamil may be available as R2/R3 in Tamil Nadu schools. Please select the final languages based on your school.",
  },
  Kerala: {
    suggestedRegionalLanguage: "Malayalam",
    suggestionText: "Malayalam may be available as R2/R3 in Kerala schools. Please select the final languages based on your school.",
  },
  Maharashtra: {
    suggestedRegionalLanguage: "Marathi",
    suggestionText: "Marathi may be available as R2/R3 in Maharashtra schools. Please select the final languages based on your school.",
  },
  Delhi: {
    suggestedRegionalLanguage: "Hindi/Sanskrit/Other Indian Language",
    suggestionText: "Hindi, Sanskrit, or another Indian language may be available in Delhi schools. Please select the final languages based on your school.",
  },
};

export function getStateLanguageSuggestion(state: string) {
  const suggestion = getIndiaStateSuggestion(state);
  if (suggestion) {
    return {
      suggestedRegionalLanguage: suggestion.suggestedLanguages[0] || "",
      suggestionText: suggestion.suggestionText,
    };
  }
  return stateLanguageCatalog[state];
}
