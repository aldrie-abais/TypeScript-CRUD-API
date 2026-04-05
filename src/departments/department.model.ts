import { DataTypes, Model, Sequelize } from 'sequelize';

export default function (sequelize: Sequelize) {
    class Department extends Model {}

    Department.init({
        name: { type: DataTypes.STRING, allowNull: false },
        description: { type: DataTypes.STRING, allowNull: false }
    }, {
        sequelize,
        modelName: 'Department',
        tableName: 'departments',
        timestamps: false
    });

    return Department;
}