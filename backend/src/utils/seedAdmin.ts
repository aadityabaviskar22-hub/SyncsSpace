import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import User from '../models/User.js';
import Project from '../models/Project.js';
import Task from '../models/Task.js';
import Note from '../models/Note.js';
import { connectDB, disconnectDB } from '../config/db.js';

const seedDatabase = async () => {
  try {
    console.log('🌱 [Seeder] Connecting to MongoDB...');
    await connectDB();

    // 1. Seed or Verify Admin User
    const adminEmail = process.env.ADMIN_SEED_EMAIL || 'admin@projecthub.com';
    const adminPassword = process.env.ADMIN_SEED_PASSWORD || 'AdminPassword123!';

    let admin = await User.findOne({ email: adminEmail.toLowerCase() });

    if (!admin) {
      console.log(`👤 [Seeder] Creating default Admin account (${adminEmail})...`);
      admin = await User.create({
        name: 'System Administrator',
        email: adminEmail.toLowerCase(),
        password: adminPassword,
        role: 'Admin',
        department: 'Operations',
        isOnline: false,
        lastActiveAt: new Date(),
      });
      console.log('✅ [Seeder] Admin account created successfully.');
    } else {
      console.log(`ℹ️ [Seeder] Admin account (${adminEmail}) already exists.`);
    }

    // 2. Seed Demo Manager User
    const managerEmail = 'manager@projecthub.com';
    let manager = await User.findOne({ email: managerEmail });
    if (!manager) {
      manager = await User.create({
        name: 'Sarah Connor (Manager)',
        email: managerEmail,
        password: 'ManagerPassword123!',
        role: 'Manager',
        department: 'Engineering',
      });
      console.log(`✅ [Seeder] Manager account created: ${managerEmail}`);
    }

    // 3. Seed Demo Member User
    const memberEmail = 'member@projecthub.com';
    let member = await User.findOne({ email: memberEmail });
    if (!member) {
      member = await User.create({
        name: 'John Doe (Member)',
        email: memberEmail,
        password: 'MemberPassword123!',
        role: 'Member',
        department: 'Engineering',
      });
      console.log(`✅ [Seeder] Member account created: ${memberEmail}`);
    }

    // 4. Seed Demo Project Workspace
    let demoProject = await Project.findOne({ title: 'Cloud Infrastructure Migration' });
    if (!demoProject && manager && member) {
      demoProject = await Project.create({
        title: 'Cloud Infrastructure Migration',
        description: 'Final year capstone workspace for real-time micro-client orchestration.',
        status: 'Active',
        priority: 'High',
        createdBy: manager._id as any,
        members: [manager._id, member._id, admin._id] as any,
        dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
      });

      // Sample Tasks
      await Task.create([
        {
          title: 'Configure Docker Compose Networks & Volumes',
          description: 'Orchestrate React, Angular, Node.js API, and MongoDB container bridges.',
          status: 'Done',
          priority: 'High',
          orderIndex: 0,
          projectId: demoProject._id,
          assignedTo: member._id,
          createdBy: manager._id,
        },
        {
          title: 'Implement Socket.IO Room Scoping & Handshake Auth',
          description: 'Enforce JWT authentication middleware before accepting WebSocket connections.',
          status: 'InProgress',
          priority: 'Urgent',
          orderIndex: 0,
          projectId: demoProject._id,
          assignedTo: member._id,
          createdBy: manager._id,
        },
        {
          title: 'Design Angular Material Analytics Widgets',
          description: 'Display Chart.js weekly task velocity and user workload breakdown.',
          status: 'Todo',
          priority: 'Medium',
          orderIndex: 0,
          projectId: demoProject._id,
          assignedTo: member._id,
          createdBy: manager._id,
        },
      ]);

      // Sample Note
      await Note.create({
        title: 'Sprint 1 Kickoff Architecture Minutes',
        content: '# Sprint Kickoff Notes\n- Verified MongoDB replica set configuration.\n- Tested Socket.IO handshake auth with JWT.\n- Set up Angular Material standalone dashboard.',
        projectId: demoProject._id,
        authorId: manager._id,
        lastModifiedBy: manager._id,
        isPinned: true,
        version: 1,
      });

      console.log('✅ [Seeder] Demo project with initial tasks and notes seeded successfully.');
    }

    console.log('\n======================================================');
    console.log('🎉 [Seeder] Database seeding complete! Credentials:');
    console.log('------------------------------------------------------');
    console.log('👑 Admin:   admin@projecthub.com   | AdminPassword123!');
    console.log('👔 Manager: manager@projecthub.com | ManagerPassword123!');
    console.log('🧑‍💻 Member:  member@projecthub.com  | MemberPassword123!');
    console.log('======================================================\n');

    await disconnectDB();
    process.exit(0);
  } catch (error) {
    console.error('❌ [Seeder] Failed to seed database:', error);
    process.exit(1);
  }
};

seedDatabase();
