const mongoose = require('mongoose');


const PermissionSchema = new mongoose.Schema({
    module: { type: String, required: true },
    add: { type: Boolean, default: false },
    edit: { type: Boolean, default: false },
    delete: { type: Boolean, default: false },
    export: { type: Boolean, default: false }
}, { _id: false });

const AdminUserSchema = new mongoose.Schema({
    name: { type: String, required: true },
    mobile: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    admin_type: { type: String, default: 'Sub Admin' },
    password: { type: String, required: true },
    country_access: { type: Boolean, default: false },
    city_access: { type: Boolean, default: false },
    permissions: [PermissionSchema],
}, { timestamps: true });


module.exports = mongoose.model('AdminUser', AdminUserSchema);
