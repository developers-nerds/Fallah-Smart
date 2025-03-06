const { AnimalGaston, Media } = require('../database/assossiation');

const animalGastonController = {
  // Get all animals for a user
  getAllAnimals: async (req, res) => {
    try {
      const animals = await AnimalGaston.findAll({
        where: { userId: req.user.id },
        include: [{ model: Media, as: 'media' }]
      });
      res.json(animals);
    } catch (error) {
      console.error('Error fetching animals:', error);
      res.status(500).json({ error: 'Failed to fetch animals' });
    }
  },

  // Get a single animal by ID
  getAnimalById: async (req, res) => {
    try {
      const animal = await AnimalGaston.findOne({
        where: { 
          id: req.params.id,
          userId: req.user.id 
        },
        include: [{ model: Media, as: 'media' }]
      });

      if (!animal) {
        return res.status(404).json({ error: 'Animal not found' });
      }

      res.json(animal);
    } catch (error) {
      console.error('Error fetching animal:', error);
      res.status(500).json({ error: 'Failed to fetch animal' });
    }
  },

  // Create a new animal
  createAnimal: async (req, res) => {
    try {
      const {
        type,
        count,
        healthStatus,
        feedingSchedule,
        gender,
        feeding,
        health,
        diseases,
        medications,
        vaccination,
        notes
      } = req.body;

      const animal = await AnimalGaston.create({
        userId: req.user.id,
        type,
        count,
        healthStatus,
        feedingSchedule,
        gender,
        feeding,
        health,
        diseases,
        medications,
        vaccination,
        notes
      });

      const createdAnimal = await AnimalGaston.findOne({
        where: { id: animal.id },
        include: [{ model: Media, as: 'media' }]
      });

      res.status(201).json(createdAnimal);
    } catch (error) {
      console.error('Error creating animal:', error);
      res.status(500).json({ error: 'Failed to create animal' });
    }
  },

  // Update an animal
  updateAnimal: async (req, res) => {
    try {
      const {
        type,
        count,
        healthStatus,
        feedingSchedule,
        gender,
        feeding,
        health,
        diseases,
        medications,
        vaccination,
        notes
      } = req.body;

      await req.animal.update({
        type,
        count,
        healthStatus,
        feedingSchedule,
        gender,
        feeding,
        health,
        diseases,
        medications,
        vaccination,
        notes
      });

      const updatedAnimal = await AnimalGaston.findOne({
        where: { id: req.params.id },
        include: [{ model: Media, as: 'media' }]
      });

      res.json(updatedAnimal);
    } catch (error) {
      console.error('Error updating animal:', error);
      res.status(500).json({ error: 'Failed to update animal' });
    }
  },

  // Delete an animal
  deleteAnimal: async (req, res) => {
    try {
      await req.animal.destroy();
      res.json({ message: 'Animal deleted successfully' });
    } catch (error) {
      console.error('Error deleting animal:', error);
      res.status(500).json({ error: 'Failed to delete animal' });
    }
  }
};

module.exports = animalGastonController; 