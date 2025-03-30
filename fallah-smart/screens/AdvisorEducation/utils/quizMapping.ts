// Map crop ID (1-31) to quiz ID (8-38)
export const mapCropIdToQuizId = (cropId: number): number => {
  // Validate crop ID range
  if (cropId < 1 || cropId > 31) {
    throw new Error(`Invalid crop ID: ${cropId}. Must be between 1 and 31.`);
  }
  // Add 7 to convert from crop ID to quiz ID
  return cropId + 7;
};

// Map quiz ID (8-38) to crop ID (1-31)
export const mapQuizIdToCropId = (quizId: number): number => {
  // Validate quiz ID range for crops
  if (quizId < 8 || quizId > 38) {
    throw new Error(`Invalid quiz ID for crop: ${quizId}. Must be between 8 and 38.`);
  }
  // Subtract 7 to convert from quiz ID to crop ID
  return quizId - 7;
};

// For animals, the IDs are the same in both tables (1-7)
export const mapAnimalIdToQuizId = (animalId: number): number => {
  // Validate animal ID range
  if (animalId < 1 || animalId > 7) {
    throw new Error(`Invalid animal ID: ${animalId}. Must be between 1 and 7.`);
  }
  return animalId; // No conversion needed for animals
};

export const isValidQuizId = (id: number, type: 'animal' | 'crop'): boolean => {
  if (type === 'animal') {
    return id >= 1 && id <= 7;
  } else {
    return id >= 8 && id <= 38;
  }
};

export const getQuizRange = (type: 'animal' | 'crop'): { min: number; max: number } => {
  return type === 'animal' ? { min: 1, max: 7 } : { min: 8, max: 38 };
};

// Get the valid range for the original table IDs
export const getTableIdRange = (type: 'animal' | 'crop'): { min: number; max: number } => {
  return type === 'animal' ? { min: 1, max: 7 } : { min: 1, max: 31 };
}; 