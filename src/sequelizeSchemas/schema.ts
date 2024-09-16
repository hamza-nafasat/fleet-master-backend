import { DataTypes } from "sequelize";
import { sequelize } from "../database/connection.js";

export const sqlUser = sequelize.define("sqluser", {
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
  },
});
