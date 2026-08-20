import '../src/prisma/db-env';
import { seedPlans } from './seed_plans';

seedPlans()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
