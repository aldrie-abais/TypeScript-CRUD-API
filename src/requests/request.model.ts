import { DataTypes, Model, Sequelize } from 'sequelize';

export default function (sequelize: Sequelize) {
    class Request extends Model {}

    Request.init({
        type: { type: DataTypes.STRING, allowNull: false },
        items: { type: DataTypes.JSON, allowNull: false }, // Stores our array of items perfectly
        status: { type: DataTypes.STRING, defaultValue: 'Pending' },
        date: { type: DataTypes.STRING, allowNull: false },
        employeeEmail: { type: DataTypes.STRING, allowNull: false }
    }, {
        sequelize,
        modelName: 'Request',
        tableName: 'requests',
        timestamps: false
    });

    return Request;
}