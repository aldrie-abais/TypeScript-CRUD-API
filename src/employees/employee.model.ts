import { DataTypes, Model, Sequelize } from 'sequelize';

export default function (sequelize: Sequelize) {
    class Employee extends Model {}

    Employee.init({
        empId: { type: DataTypes.STRING, allowNull: false, unique: true },
        email: { type: DataTypes.STRING, allowNull: false },
        position: { type: DataTypes.STRING, allowNull: false },
        department: { type: DataTypes.STRING, allowNull: false },
        hireDate: { type: DataTypes.DATEONLY, allowNull: false }
    }, {
        sequelize,
        modelName: 'Employee',
        tableName: 'employees',
        timestamps: false
    });

    return Employee;
}