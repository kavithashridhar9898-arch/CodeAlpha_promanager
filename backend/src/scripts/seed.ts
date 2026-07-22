import { PrismaClient, Role, ProjectStatus, TaskStatus, Priority } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // 1. Clean existing data
  await prisma.activityLog.deleteMany({});
  await prisma.comment.deleteMany({});
  await prisma.task.deleteMany({});
  await prisma.boardColumn.deleteMany({});
  await prisma.board.deleteMany({});
  await prisma.projectMember.deleteMany({});
  await prisma.project.deleteMany({});
  await prisma.user.deleteMany({});

  // 2. Create Demo User
  const hashedPassword = await bcrypt.hash('password123', 10);
  const demoUser = await prisma.user.create({
    data: {
      email: 'demo@promanager.com',
      name: 'Demo User',
      password: hashedPassword,
      role: Role.MEMBER,
      jobTitle: 'Product Manager',
    }
  });

  const developer1 = await prisma.user.create({
    data: {
      email: 'dev1@promanager.com',
      name: 'Alice Developer',
      password: hashedPassword,
      role: Role.MEMBER,
      jobTitle: 'Senior Frontend Engineer',
    }
  });

  const designer = await prisma.user.create({
    data: {
      email: 'design@promanager.com',
      name: 'Bob Designer',
      password: hashedPassword,
      role: Role.MEMBER,
      jobTitle: 'UI/UX Designer',
    }
  });

  // 3. Create Project
  const project = await prisma.project.create({
    data: {
      name: 'ProManager v2.0 Launch',
      description: 'The big launch for the new enterprise version of ProManager.',
      status: ProjectStatus.ACTIVE,
      ownerId: demoUser.id,
      members: {
        create: [
          { userId: demoUser.id, role: 'OWNER' },
          { userId: developer1.id, role: 'MEMBER' },
          { userId: designer.id, role: 'MEMBER' },
        ]
      }
    }
  });

  // 4. Create Board & Columns
  const board = await prisma.board.create({
    data: {
      name: 'Sprint 14',
      projectId: project.id,
    }
  });

  const colTodo = await prisma.boardColumn.create({ data: { name: 'To Do', order: 0, boardId: board.id } });
  const colInProg = await prisma.boardColumn.create({ data: { name: 'In Progress', order: 1, boardId: board.id } });
  const colReview = await prisma.boardColumn.create({ data: { name: 'In Review', order: 2, boardId: board.id } });
  const colDone = await prisma.boardColumn.create({ data: { name: 'Done', order: 3, boardId: board.id } });

  // 5. Create Tasks
  await prisma.task.create({
    data: {
      title: 'Design new Landing Page',
      description: 'Create high-fidelity mockups for the new public landing page.',
      status: TaskStatus.IN_PROGRESS,
      priority: Priority.HIGH,
      columnId: colInProg.id,
      assigneeId: designer.id,
    }
  });

  const devTask = await prisma.task.create({
    data: {
      title: 'Implement Dark Mode',
      description: 'Use next-themes to implement a persistent dark mode toggle.',
      status: TaskStatus.IN_REVIEW,
      priority: Priority.MEDIUM,
      columnId: colReview.id,
      assigneeId: developer1.id,
    }
  });

  await prisma.task.create({
    data: {
      title: 'Write API Documentation',
      description: 'Document the new REST endpoints using Swagger.',
      status: TaskStatus.TODO,
      priority: Priority.MEDIUM,
      columnId: colTodo.id,
      assigneeId: demoUser.id,
    }
  });

  await prisma.task.create({
    data: {
      title: 'Setup CI/CD Pipeline',
      description: 'Configure GitHub Actions for automated testing and deployment.',
      status: TaskStatus.DONE,
      priority: Priority.URGENT,
      columnId: colDone.id,
      assigneeId: developer1.id,
    }
  });

  // 6. Create some comments
  await prisma.comment.create({
    data: {
      content: 'I have started working on this!',
      taskId: devTask.id,
      authorId: developer1.id,
    }
  });

  console.log('Database seeded successfully! Demo User: demo@promanager.com / password123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
