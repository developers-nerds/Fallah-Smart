const { Pesticide } = require('../database/models');

const createPesticide = async (req, res) => {
  try {
    const pesticide = await Pesticide.create({
      ...req.body,
      userId: req.user.id
    });
    res.status(201).json(pesticide);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const getAllPesticides = async (req, res) => {
  try {
    const pesticides = await Pesticide.findAll({
      where: { userId: req.user.id }
    });
    res.json(pesticides);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getPesticideById = async (req, res) => {
  try {
    const pesticide = await Pesticide.findOne({
      where: {
        id: req.params.id,
        userId: req.user.id
      }
    });
    if (!pesticide) {
      return res.status(404).json({ error: 'Pesticide not found' });
    }
    res.json(pesticide);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const updatePesticide = async (req, res) => {
  try {
    const pesticide = await Pesticide.findOne({
      where: {
        id: req.params.id,
        userId: req.user.id
      }
    });
    if (!pesticide) {
      return res.status(404).json({ error: 'Pesticide not found' });
    }
    await pesticide.update(req.body);
    res.json(pesticide);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const deletePesticide = async (req, res) => {
  try {
    const pesticide = await Pesticide.findOne({
      where: {
        id: req.params.id,
        userId: req.user.id
      }
    });
    if (!pesticide) {
      return res.status(404).json({ error: 'Pesticide not found' });
    }
    await pesticide.destroy();
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const updatePesticideQuantity = async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity, type } = req.body;

    const pesticide = await Pesticide.findOne({
      where: {
        id,
        userId: req.user.id
      }
    });
    if (!pesticide) {
      return res.status(404).json({ error: 'Pesticide not found' });
    }

    if (type === 'add') {
      pesticide.quantity += quantity;
    } else if (type === 'remove') {
      if (pesticide.quantity < quantity) {
        return res.status(400).json({ error: 'Insufficient quantity' });
      }
      pesticide.quantity -= quantity;
    }

    await pesticide.save();
    res.json(pesticide);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

module.exports = {
  createPesticide,
  getAllPesticides,
  getPesticideById,
  updatePesticide,
  deletePesticide,
  updatePesticideQuantity
};