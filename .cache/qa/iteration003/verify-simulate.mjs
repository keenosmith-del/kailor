import {db} from '../../../backend/src/db.ts';
import {config} from '../../../backend/src/config.ts';
import {spawnSync} from 'node:child_process';
if(!new URL(config.DATABASE_URL).pathname.endsWith('_test')) throw new Error('Isolated test database required');
const email=`iteration003-cli-${Date.now()}@test.invalid`;
const admin=await db.adminUser.create({data:{email,passwordHash:'disabled-synthetic-test-owner'}});
try {
  const run=spawnSync(process.execPath,['--import','tsx','scripts/simulate.ts'],{env:{...process.env,ADMIN_EMAIL:email},stdio:'inherit',timeout:60000});
  if(run.status !== 0) throw new Error(`Simulation CLI failed: ${run.status}`);
} finally {
  const subjects=await db.discoverySession.findMany({where:{adminId:admin.id},select:{subjectId:true}});
  await db.caseIntelligenceRecord.deleteMany({where:{sourceRun:{session:{adminId:admin.id}}}});
  await db.discoverySession.deleteMany({where:{adminId:admin.id}});
  await db.subject.deleteMany({where:{id:{in:subjects.map(s=>s.subjectId)}}});
  await db.auditEvent.deleteMany({where:{actorId:admin.id}});
  await db.adminUser.delete({where:{id:admin.id}});
  await db.$disconnect();
}
