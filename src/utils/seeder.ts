import mongoose from 'mongoose';
import { config } from '../config/env';
import User from '../models/User';

const seedAdminUser = async () => {
  try {
    // 1. Unganisha na MongoDB kupitia URI iliyopo kwenye config
    await mongoose.connect(config.mongoUri);
    console.log('Database imeunganishwa kikamilifu kwa ajili ya Seeding...');

    // 2. Angalia kama Admin yupo tayari kwenye mfumo
    const adminEmail = 'admin@backendapi.com';
    const existingAdmin = await User.findOne({ email: adminEmail });

    if (existingAdmin) {
      console.log('Akaunti ya Msimamizi (Admin) ipo tayari kwenye mfumo, hakuna haja ya kuunda upya.');
      process.exit();
    }

    // 3. Unda akaunti mpya ya Admin yenye nguvu
    await User.create({
      name: 'System Super Admin',
      email: adminEmail,
      password: 'AdminSecurePassword2026!',
      role: 'admin',
      isVerified: true,
    });

    console.log('MAFANIKIO: Akaunti ya Msimamizi (Admin) imetengenezwa kikamilifu!');
    console.log('Email: admin@backendapi.com');
    console.log('Password: AdminSecurePassword2026!');
    
    process.exit();
  } catch (error: any) {
    console.error('Kosa limetokea wakati wa kuunda Admin:', error.message);
    process.exit(1);
  }
};

seedAdminUser();
