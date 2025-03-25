module.exports = (sequelize, DataTypes) => {
  const Suppliers = sequelize.define(
    "Suppliers",
    {
      company_name: {
        type: DataTypes.STRING(100),
        allowNull: false,
        validate: {
          len: [2, 100],
          notEmpty: true,
        },
      },
      about_us: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      company_address: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      company_phone: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      company_email: {
        type: DataTypes.STRING(100),
      },
      company_website: {
        type: DataTypes.STRING(100),
      },
      company_logo: {
        type: DataTypes.STRING(100),
      },
      company_banner: {
        type: DataTypes.STRING(100),
      },
      is_verified: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      open_time: {
        type: DataTypes.TIME,
        allowNull: true,
      },
      close_time: {
        type: DataTypes.TIME,
        allowNull: true,
      },
    },
    {
      timestamps: true,
      tableName: "suppliers",
    }
  );

  return Suppliers;
};
