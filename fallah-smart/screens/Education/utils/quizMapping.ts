export const mapSequentialToActualId = (sequentialId: number, type: 'animal' | 'crop'): number => {
  // For animal quizzes (1-7)
  if (type === 'animal') {
    if (sequentialId >= 1 && sequentialId <= 7) {
      return sequentialId; // Animal IDs remain the same
    }
  }
  // For crop quizzes (8-38)
  else if (type === 'crop') {
    if (sequentialId >= 8 && sequentialId <= 38) {
      return sequentialId; // Crop IDs remain the same
    }
  }
  throw new Error(`Invalid sequential ID ${sequentialId} for type ${type}`);
};

export const mapActualToSequentialId = (actualId: number, type: 'animal' | 'crop'): number => {
  // For animal quizzes (1-7)
  if (type === 'animal') {
    if (actualId >= 1 && actualId <= 7) {
      return actualId; // Animal IDs remain the same
    }
  }
  // For crop quizzes (8-38)
  else if (type === 'crop') {
    if (actualId >= 8 && actualId <= 38) {
      return actualId; // Crop IDs remain the same
    }
  }
  throw new Error(`Invalid actual ID ${actualId} for type ${type}`);
};

export const isValidQuizId = (id: number, type: 'animal' | 'crop'): boolean => {
  if (type === 'animal') {
    return id >= 1 && id <= 7;
  } else {
    return id >= 8 && id <= 38; // Crop quizzes are stored with IDs 8-38
  }
};

export const getQuizRange = (type: 'animal' | 'crop'): { min: number; max: number } => {
  return type === 'animal' ? { min: 1, max: 7 } : { min: 8, max: 38 };
}; 