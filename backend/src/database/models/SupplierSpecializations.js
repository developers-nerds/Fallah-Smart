module.exports = (sequelize, DataTypes) => {
  const SupplierSpecializations = sequelize.define(
    "SupplierSpecializations",
    {
      supplierId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "suppliers",
          key: "id",
        },
      },
      specializationId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "specializations",
          key: "id",
        },
      },
    },
    {
      timestamps: true,
      tableName: "supplier_specializations",
    }
  );

  return SupplierSpecializations;
};
