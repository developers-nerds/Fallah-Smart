const { Animal_doc } = require('../database/assossiation');

const animalController = {
  getAllAnimals: async (req, res) => {
    try {
      const animals = await Animal_doc.findAll();
      res.status(200).json(animals);
    } catch (error) {
     throw error;
    }
  },
  getAnimalById: async (req, res) => {
    const { id } = req.params;
    try {
      const animal = await Animal_doc.findByPk(id);
      res.status(200).json(animal);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
  createAnimal: async (req, res) => {
    const { name, category, image } = req.body;
    try {
      const animal = await Animal_doc.create({ name, category, image });
      res.status(201).json(animal);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
  updateAnimal: async (req, res) => {
    const { id, name, category, image } = req.body;
    try {
      const animal = await Animal_doc.update({ name, category, image }, { where: { id } });
      res.status(200).json(animal);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
  deleteAnimal: async (req, res) => {
    const { id } = req.params;
    try {
      await Animal_doc.destroy({ where: { id } });
      res.status(204).json({ message: 'Animal deleted successfully' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
};  

module.exports = animalController;
