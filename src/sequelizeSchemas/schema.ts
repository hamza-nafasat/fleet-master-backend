// models/sensorData.js
import { DataTypes } from "sequelize";

// Function that takes a sequelize instance and returns the SensorData model
export const defineSensorData = (sequelize: any) => {
  return sequelize.define(
    "SensorData",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      topic: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      uniqueId: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      ownerId: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      truckId: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      timestamp: {
        type: DataTypes.DOUBLE,
        allowNull: false,
      },
      gps_latitude: {
        type: DataTypes.FLOAT,
        allowNull: false,
      },
      gps_longitude: {
        type: DataTypes.FLOAT,
        allowNull: false,
      },
      gps_altitude: {
        type: DataTypes.FLOAT,
        allowNull: true,
      },
      speed: {
        type: DataTypes.FLOAT,
        allowNull: false,
      },
      fuel_level: {
        type: DataTypes.FLOAT,
        allowNull: true,
      },
      engine_temperature: {
        type: DataTypes.FLOAT,
        allowNull: true,
      },
      tire_pressure_front_left: {
        type: DataTypes.FLOAT,
        allowNull: true,
      },
      tire_pressure_front_right: {
        type: DataTypes.FLOAT,
        allowNull: true,
      },
      tire_pressure_rear_left: {
        type: DataTypes.FLOAT,
        allowNull: true,
      },
      tire_pressure_rear_right: {
        type: DataTypes.FLOAT,
        allowNull: true,
      },
      battery_voltage: {
        type: DataTypes.FLOAT,
        allowNull: true,
      },
      cargo_temperature: {
        type: DataTypes.FLOAT,
        allowNull: true,
      },
      driver_status: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      route_status: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      odometer: {
        type: DataTypes.FLOAT,
        allowNull: true,
      },
      acceleration_x: {
        type: DataTypes.FLOAT,
        allowNull: true,
      },
      acceleration_y: {
        type: DataTypes.FLOAT,
        allowNull: true,
      },
      acceleration_z: {
        type: DataTypes.FLOAT,
        allowNull: true,
      },
      gyroscope_roll: {
        type: DataTypes.FLOAT,
        allowNull: true,
      },
      gyroscope_pitch: {
        type: DataTypes.FLOAT,
        allowNull: true,
      },
      gyroscope_yaw: {
        type: DataTypes.FLOAT,
        allowNull: true,
      },
      maintenance_due: {
        type: DataTypes.BOOLEAN,
        allowNull: true,
      },
    },
    {
      tableName: "sensor_data",
      timestamps: true,
    }
  );
};
