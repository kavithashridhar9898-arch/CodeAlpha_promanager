const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const teams = await prisma.team.findMany({
    include: { members: true },
  });
  console.dir(teams, { depth: null });
}

main().finally(() => prisma.$disconnect());
