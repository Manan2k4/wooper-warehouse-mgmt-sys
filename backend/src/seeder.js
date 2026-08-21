const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');
const Warehouse = require('./models/Warehouse');
const Category = require('./models/Category');
const Location = require('./models/Location');
const Product = require('./models/Product');
const AuditLog = require('./models/AuditLog');
const { generateQRCode } = require('./utils/barcode');

dotenv.config();

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/warehouse_mgmt_db');
    console.log('Clearing old collections...');
    await Promise.all([
      User.deleteMany(),
      Warehouse.deleteMany(),
      Category.deleteMany(),
      Location.deleteMany(),
      Product.deleteMany(),
      AuditLog.deleteMany()
    ]);

    console.log('Seeding warehouses...');
    const wh1 = await Warehouse.create({
      name: 'Central Distribution Center',
      code: 'WH-CENTRAL-01',
      address: { street: '500 Logistics Way', city: 'Dallas', state: 'TX', country: 'USA', postalCode: '75001' },
      capacitySqFt: 75000
    });

    const wh2 = await Warehouse.create({
      name: 'West Coast Logistics Hub',
      code: 'WH-WEST-02',
      address: { street: '120 Harbor Blvd', city: 'Long Beach', state: 'CA', country: 'USA', postalCode: '90802' },
      capacitySqFt: 45000
    });

    console.log('Seeding categories...');
    const catElec = await Category.create({ name: 'Electronics', code: 'ELEC', description: 'Sensors, Scanners, and Microcontrollers' });
    const catInd = await Category.create({ name: 'Industrial Equipment', code: 'IND', description: 'Tools, Pallets, and Machinery' });
    const catPack = await Category.create({ name: 'Packaging Materials', code: 'PACK', description: 'Boxes, Tape, and Pallet Wraps' });

    console.log('Seeding locations...');
    const loc1 = await Location.create({ warehouse: wh1._id, zone: 'A', rack: 'R01', shelf: 'S1', bin: 'B01' });
    const loc2 = await Location.create({ warehouse: wh1._id, zone: 'A', rack: 'R02', shelf: 'S3', bin: 'B02' });
    const loc3 = await Location.create({ warehouse: wh1._id, zone: 'B', rack: 'R05', shelf: 'S1', bin: 'B10' });

    console.log('Seeding users for all 4 RBAC roles (Password: password123)...');
    const admin = await User.create({ name: 'Alice SuperAdmin', email: 'admin@wms.com', password: 'password123', role: 'super_admin' });
    const manager = await User.create({ name: 'Bob Manager', email: 'manager@wms.com', password: 'password123', role: 'warehouse_manager', assignedWarehouse: wh1._id });
    const staff = await User.create({ name: 'Charlie Staff', email: 'staff@wms.com', password: 'password123', role: 'warehouse_staff', assignedWarehouse: wh1._id });
    const auditor = await User.create({ name: 'Diana Auditor', email: 'auditor@wms.com', password: 'password123', role: 'auditor' });

    console.log('Seeding products...');
    const p1Qr = await generateQRCode(JSON.stringify({ sku: 'ELEC-LOG-1001', barcode: 'BC-8829101', name: 'Industrial 2D Barcode Scanner' }));
    const p2Qr = await generateQRCode(JSON.stringify({ sku: 'IND-LIFT-2002', barcode: 'BC-9938210', name: 'Hydraulic Pallet Truck 3-Ton' }));
    const p3Qr = await generateQRCode(JSON.stringify({ sku: 'PACK-BOX-3003', barcode: 'BC-1122334', name: 'Heavy Duty Double-Wall Box 24x18x18' }));

    await Product.create([
      {
        name: 'Industrial 2D Barcode Scanner',
        sku: 'ELEC-LOG-1001',
        barcode: 'BC-8829101',
        qrCodeData: p1Qr,
        category: catElec._id,
        brand: 'ScanPro Tech',
        unit: 'PCS',
        costPrice: 65.00,
        sellingPrice: 129.99,
        reorderLevel: 15,
        stock: { available: 85, reserved: 10, damaged: 2, returned: 0 },
        warehouse: wh1._id,
        location: loc1._id,
        batchNumber: 'BAT-2026-01'
      },
      {
        name: 'Hydraulic Pallet Truck 3-Ton',
        sku: 'IND-LIFT-2002',
        barcode: 'BC-9938210',
        qrCodeData: p2Qr,
        category: catInd._id,
        brand: 'TitanLift',
        unit: 'PCS',
        costPrice: 240.00,
        sellingPrice: 420.00,
        reorderLevel: 5,
        stock: { available: 3, reserved: 2, damaged: 0, returned: 0 },
        warehouse: wh1._id,
        location: loc2._id,
        batchNumber: 'BAT-2026-02'
      },
      {
        name: 'Heavy Duty Double-Wall Box 24x18x18',
        sku: 'PACK-BOX-3003',
        barcode: 'BC-1122334',
        qrCodeData: p3Qr,
        category: catPack._id,
        brand: 'EcoPack',
        unit: 'BOX',
        costPrice: 1.80,
        sellingPrice: 3.50,
        reorderLevel: 200,
        stock: { available: 850, reserved: 50, damaged: 10, returned: 5 },
        warehouse: wh1._id,
        location: loc3._id,
        batchNumber: 'BAT-2026-03'
      }
    ]);

    console.log('Seeding initial audit logs...');
    await AuditLog.create([
      {
        user: admin._id,
        userName: admin.name,
        userRole: admin.role,
        action: 'LOGIN',
        entityType: 'Auth',
        entityId: admin._id.toString(),
        newValues: { email: admin.email },
        ipAddress: '127.0.0.1',
        userAgent: 'Seed-Init'
      },
      {
        user: manager._id,
        userName: manager.name,
        userRole: manager.role,
        action: 'PRODUCT_CREATE',
        entityType: 'Product',
        newValues: { name: 'Industrial 2D Barcode Scanner', sku: 'ELEC-LOG-1001' },
        ipAddress: '127.0.0.1',
        userAgent: 'Seed-Init'
      }
    ]);

    console.log('🎉 Database successfully seeded with full initial test suite!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seeder Failed:', err);
    process.exit(1);
  }
};

seed();
