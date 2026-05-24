export type IndiaStateSuggestion = {
  suggestedLanguages: string[];
  suggestionText: string;
};

export const indiaStateOptions = [
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
  "Andaman and Nicobar Islands",
  "Chandigarh",
  "Dadra and Nagar Haveli and Daman and Diu",
  "Delhi",
  "Jammu and Kashmir",
  "Ladakh",
  "Lakshadweep",
  "Puducherry",
  "Other / Outside India",
];

export const indiaStateLanguageCatalog: Record<string, IndiaStateSuggestion> = {
  "Andhra Pradesh": suggestion(["Telugu", "Hindi", "English"]),
  "Arunachal Pradesh": suggestion(["English", "Hindi", "Other"]),
  Assam: suggestion(["Assamese", "Hindi", "English"]),
  Bihar: suggestion(["Hindi", "Maithili", "English"]),
  Chhattisgarh: suggestion(["Hindi", "English", "Other"]),
  Goa: suggestion(["Konkani", "Marathi", "English"]),
  Gujarat: suggestion(["Gujarati", "Hindi", "English"]),
  Haryana: suggestion(["Hindi", "Sanskrit", "English"]),
  "Himachal Pradesh": suggestion(["Hindi", "Sanskrit", "English"]),
  Jharkhand: suggestion(["Hindi", "Santali", "English"]),
  Karnataka: suggestion(["Kannada", "Hindi", "English"]),
  Kerala: suggestion(["Malayalam", "Hindi", "English"]),
  "Madhya Pradesh": suggestion(["Hindi", "Sanskrit", "English"]),
  Maharashtra: suggestion(["Marathi", "Hindi", "English"]),
  Manipur: suggestion(["Manipuri", "Hindi", "English"]),
  Meghalaya: suggestion(["English", "Hindi", "Other"]),
  Mizoram: suggestion(["English", "Hindi", "Other"]),
  Nagaland: suggestion(["English", "Hindi", "Other"]),
  Odisha: suggestion(["Odia", "Hindi", "English"]),
  Punjab: suggestion(["Punjabi", "Hindi", "English"]),
  Rajasthan: suggestion(["Hindi", "Sanskrit", "English"]),
  Sikkim: suggestion(["Nepali", "Hindi", "English"]),
  "Tamil Nadu": suggestion(["Tamil", "Hindi", "English"]),
  Telangana: suggestion(["Telugu", "Hindi", "English"]),
  Tripura: suggestion(["Bengali", "Hindi", "English"]),
  "Uttar Pradesh": suggestion(["Hindi", "Sanskrit", "English"]),
  Uttarakhand: suggestion(["Hindi", "Sanskrit", "English"]),
  "West Bengal": suggestion(["Bengali", "Hindi", "English"]),
  "Andaman and Nicobar Islands": suggestion(["Hindi", "Bengali", "English"]),
  Chandigarh: suggestion(["Hindi", "Punjabi", "English"]),
  "Dadra and Nagar Haveli and Daman and Diu": suggestion(["Gujarati", "Hindi", "English"]),
  Delhi: suggestion(["Hindi", "Sanskrit", "English"]),
  "Jammu and Kashmir": suggestion(["Kashmiri", "Dogri", "English"]),
  Ladakh: suggestion(["Tibetan", "Hindi", "English"]),
  Lakshadweep: suggestion(["Malayalam", "Hindi", "English"]),
  Puducherry: suggestion(["Tamil", "Telugu", "English"]),
};

export function getIndiaStateSuggestion(state: string) {
  return indiaStateLanguageCatalog[state];
}

function suggestion(languages: string[]): IndiaStateSuggestion {
  return {
    suggestedLanguages: languages,
    suggestionText: `Suggested/common languages for selected state: ${languages.join(", ")}. Please select final R1/R2/R3 based on your school.`,
  };
}
