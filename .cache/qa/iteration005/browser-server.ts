import express from 'express';
import { resolve } from 'node:path';
import { app } from '../../../backend/src/app.js';
import { db } from '../../../backend/src/db.js';
import { hashPassword } from '../../../backend/src/auth.js';
import { config } from '../../../backend/src/config.js';
if(!new URL(config.DATABASE_URL).pathname.endsWith('_test')) throw new Error('QA server requires isolated test database');
const admin=await db.adminUser.create({data:{email:`browser-005-${Date.now()}@kailor.local`,passwordHash:await hashPassword('synthetic-browser-005-password')}});
const serverApp=express();serverApp.use((req,res,next)=>req.path.startsWith('/api')?app(req,res,next):next());
serverApp.use(express.static(resolve('frontend/dist')));serverApp.get('/{*path}',(_req,res)=>res.sendFile(resolve('frontend/dist/index.html')));
const server=serverApp.listen(5052,'127.0.0.1',()=>console.log(JSON.stringify({status:'QA ready',origin:'http://localhost:5052',email:admin.email,ownerId:admin.id,syntheticOnly:true})));
async function cleanup(){server.close(); const subjects=await db.discoverySession.findMany({where:{adminId:admin.id},select:{subjectId:true}});await db.caseIntelligenceRecord.deleteMany({where:{sourceRun:{session:{adminId:admin.id}}}});await db.discoverySession.deleteMany({where:{adminId:admin.id}});await db.subject.deleteMany({where:{id:{in:subjects.map(s=>s.subjectId)}}});await db.auditEvent.deleteMany({where:{actorId:admin.id}});await db.adminUser.delete({where:{id:admin.id}});await db.$disconnect();console.log('Synthetic browser owner and records cleaned');process.exit(0);}
process.on('SIGTERM',cleanup);process.on('SIGINT',cleanup);
