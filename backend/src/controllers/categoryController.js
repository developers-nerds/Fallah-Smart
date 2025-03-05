const { Category } = require('../database/assossiation');

const categoryController = {
  // Get all categories
  getAllCategories: async (req, res) => {
    try {
      const categories = await Category.findAll();
      res.status(200).json(categories);
    } catch (error) {
      res.status(500).json({ 
        message: 'Error fetching categories',
        error: error.message 
      });
    }
  },

  // Get categories by type
  getCategoriesByType: async (req, res) => {
    try {
      const { type } = req.params;
      const categories = await Category.findAll({
        where: { type }
      });
      res.status(200).json(categories);
    } catch (error) {
      res.status(500).json({ 
        message: 'Error fetching categories by type',
        error: error.message 
      });
    }
  },

  // Create new category
  createCategory: async (req, res) => {
    try {
      const { name, type, icon, color } = req.body;
      const category = await Category.create({
        name,
        type,
        icon,
        color
      });
      res.status(201).json(category);
    } catch (error) {
      res.status(500).json({ 
        message: 'Error creating category',
        error: error.message 
      });
    }
  },

  // Update category
  updateCategory: async (req, res) => {
    try {
      const { id } = req.params;
      const { name, type, icon, color } = req.body;
      
      const category = await Category.findByPk(id);
      if (!category) {
        return res.status(404).json({ message: 'Category not found' });
      }

      await category.update({
        name: name || category.name,
        type: type || category.type,
        icon: icon || category.icon,
        color: color || category.color
      });

      res.status(200).json(category);
    } catch (error) {
      res.status(500).json({ 
        message: 'Error updating category',
        error: error.message 
      });
    }
  },

  // Delete category
  deleteCategory: async (req, res) => {
    try {
      const { id } = req.params;
      const category = await Category.findByPk(id);
      
      if (!category) {
        return res.status(404).json({ message: 'Category not found' });
      }

      await category.destroy();
      res.status(200).json({ message: 'Category deleted successfully' });
    } catch (error) {
      res.status(500).json({ 
        message: 'Error deleting category',
        error: error.message 
      });
    }
  }
};

module.exports = categoryController;