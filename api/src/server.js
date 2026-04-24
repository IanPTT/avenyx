import Fastify from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';

const fastify = Fastify({ logger: true });
const prisma = new PrismaClient();

await fastify.register(cors, { 
  origin: true,
  credentials: true
});

await fastify.register(jwt, {
  secret: process.env.JWT_SECRET || 'avenyx-super-secret-key-change-in-production'
});

fastify.decorate('prisma', prisma);

async function verifyToken(request, reply) {
  try {
    await request.jwtVerify();
  } catch (err) {
    reply.status(401).send({ error: 'Unauthorized' });
  }
}

async function verifyAdmin(request, reply) {
  try {
    await request.jwtVerify();
    if (request.user.role !== 'ADMIN') {
      reply.status(403).send({ error: 'Admin only' });
    }
  } catch (err) {
    reply.status(401).send({ error: 'Unauthorized' });
  }
}

// Auth Routes
fastify.post('/auth/register', async (request, reply) => {
  const { email, password, name } = request.body;
  
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return reply.status(400).send({ error: 'Email already exists' });
  }
  
  const hashedPassword = await bcrypt.hash(password, 10);
  const emailToken = uuidv4();
  
  const user = await prisma.user.create({
    data: { email, password: hashedPassword, name, emailToken }
  });
  
  return { message: 'Registration successful', userId: user.id };
});

fastify.post('/auth/login', async (request, reply) => {
  const { email, password } = request.body;
  
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return reply.status(401).send({ error: 'Invalid credentials' });
  }
  
  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    return reply.status(401).send({ error: 'Invalid credentials' });
  }
  
  const token = fastify.jwt.sign({ 
    id: user.id, 
    email: user.email, 
    role: user.role 
  });
  
  return { token, user: { id: user.id, email: user.email, name: user.name, role: user.role } };
});

fastify.get('/auth/me', { preHandler: verifyToken }, async (request, reply) => {
  const user = await prisma.user.findUnique({
    where: { id: request.user.id },
    include: { subscription: { include: { plan: true } } }
  });
  
  return { user };
});

fastify.post('/auth/verify-email', async (request, reply) => {
  const { token } = request.body;
  
  const user = await prisma.user.findFirst({ where: { emailToken: token } });
  if (!user) {
    return reply.status(400).send({ error: 'Invalid token' });
  }
  
  await prisma.user.update({
    where: { id: user.id },
    data: { emailVerified: true, emailToken: null }
  });
  
  return { message: 'Email verified' };
});

// Plans Routes (Public)
fastify.get('/plans', async (request, reply) => {
  const plans = await prisma.plan.findMany({
    where: { active: true },
    orderBy: { price: 'asc' }
  });
  return plans;
});

// Plans Routes (Admin)
fastify.post('/plans', { preHandler: verifyAdmin }, async (request, reply) => {
  const { name, price, duration, maxDevices } = request.body;
  
  const plan = await prisma.plan.create({
    data: { name, price, duration, maxDevices }
  });
  
  return plan;
});

fastify.put('/plans/:id', { preHandler: verifyAdmin }, async (request, reply) => {
  const { id } = request.params;
  const { name, price, duration, maxDevices, active } = request.body;
  
  const plan = await prisma.plan.update({
    where: { id },
    data: { name, price, duration, maxDevices, active }
  });
  
  return plan;
});

fastify.delete('/plans/:id', { preHandler: verifyAdmin }, async (request, reply) => {
  const { id } = request.params;
  
  await prisma.plan.delete({ where: { id } });
  
  return { message: 'Plan deleted' };
});

// Subscriptions Routes
fastify.get('/subscriptions/me', { preHandler: verifyToken }, async (request, reply) => {
  const subscription = await prisma.subscription.findUnique({
    where: { userId: request.user.id },
    include: { plan: true }
  });
  
  return subscription;
});

fastify.post('/subscriptions', { preHandler: verifyToken }, async (request, reply) => {
  const { planId } = request.body;
  const userId = request.user.id;
  
  const existing = await prisma.subscription.findUnique({
    where: { userId }
  });
  
  if (existing && existing.status === 'ACTIVE') {
    return reply.status(400).send({ error: 'Subscription already active' });
  }
  
  const subscription = await prisma.subscription.upsert({
    where: { userId },
    create: { userId, planId, status: 'PENDING_PAYMENT' },
    update: { planId, status: 'PENDING_PAYMENT' },
    include: { plan: true }
  });
  
  return subscription;
});

// Payments Routes
fastify.get('/payments', { preHandler: verifyAdmin }, async (request, reply) => {
  const payments = await prisma.paymentRequest.findMany({
    include: { user: true, plan: true },
    orderBy: { createdAt: 'desc' }
  });
  
  return payments;
});

fastify.post('/payments', { preHandler: verifyToken }, async (request, reply) => {
  const { planId, reference } = request.body;
  const userId = request.user.id;
  
  const plan = await prisma.plan.findUnique({ where: { id: planId } });
  if (!plan) {
    return reply.status(400).send({ error: 'Plan not found' });
  }
  
  const payment = await prisma.paymentRequest.create({
    data: { userId, planId, amount: plan.price, reference },
    include: { plan: true }
  });
  
  return payment;
});

fastify.put('/payments/:id/approve', { preHandler: verifyAdmin }, async (request, reply) => {
  const { id } = request.params;
  
  const payment = await prisma.paymentRequest.findUnique({
    where: { id },
    include: { user: true, plan: true }
  });
  
  if (!payment) {
    return reply.status(404).send({ error: 'Payment not found' });
  }
  
  await prisma.paymentRequest.update({
    where: { id },
    data: { status: 'APPROVED' }
  });
  
  const startDate = new Date();
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + payment.plan.duration);
  
  await prisma.subscription.upsert({
    where: { userId: payment.userId },
    create: {
      userId: payment.userId,
      planId: payment.planId,
      status: 'ACTIVE',
      startDate,
      endDate
    },
    update: {
      planId: payment.planId,
      status: 'ACTIVE',
      startDate,
      endDate
    }
  });
  
  return { message: 'Payment approved, subscription activated' };
});

fastify.put('/payments/:id/reject', { preHandler: verifyAdmin }, async (request, reply) => {
  const { id } = request.params;
  
  await prisma.paymentRequest.update({
    where: { id },
    data: { status: 'REJECTED' }
  });
  
  return { message: 'Payment rejected' };
});

// Nodes Routes
fastify.get('/nodes', async (request, reply) => {
  const nodes = await prisma.node.findMany({
    where: { active: true },
    orderBy: { capacity: 'desc' }
  });
  
  return nodes;
});

fastify.post('/nodes', { preHandler: verifyAdmin }, async (request, reply) => {
  const { name, location, apiUrl, apiKey, inboundId, capacity } = request.body;
  
  const node = await prisma.node.create({
    data: { name, location, apiUrl, apiKey, inboundId, capacity }
  });
  
  return node;
});

fastify.put('/nodes/:id', { preHandler: verifyAdmin }, async (request, reply) => {
  const { id } = request.params;
  const { name, location, apiUrl, apiKey, inboundId, capacity, active } = request.body;
  
  const node = await prisma.node.update({
    where: { id },
    data: { name, location, apiUrl, apiKey, inboundId, capacity, active }
  });
  
  return node;
});

fastify.delete('/nodes/:id', { preHandler: verifyAdmin }, async (request, reply) => {
  const { id } = request.params;
  
  await prisma.node.delete({ where: { id } });
  
  return { message: 'Node deleted' };
});

// Location Routes
fastify.put('/location', { preHandler: verifyToken }, async (request, reply) => {
  const { location } = request.body;
  
  if (!['India', 'Germany'].includes(location)) {
    return reply.status(400).send({ error: 'Invalid location' });
  }
  
  await prisma.user.update({
    where: { id: request.user.id },
    data: { location }
  });
  
  return { message: 'Location updated' };
});

// VPN Config Routes
async function selectNode(location) {
  const nodes = await prisma.node.findMany({
    where: { location, active: true },
    orderBy: { capacity: 'desc' }
  });
  
  if (nodes.length === 0) {
    throw new Error('No nodes available for this location');
  }
  
  return nodes[0];
}

fastify.get('/vpn/config', { preHandler: verifyToken }, async (request, reply) => {
  const user = await prisma.user.findUnique({
    where: { id: request.user.id },
    include: { subscription: { include: { plan: true } } }
  });
  
  if (!user.subscription || user.subscription.status !== 'ACTIVE') {
    return reply.status(403).send({ error: 'No active subscription' });
  }
  
  const node = await selectNode(user.location);
  
  const username = `user-${user.id.slice(0, 8)}`;
  const expiryDate = user.subscription.endDate;
  
  return {
    node: {
      apiUrl: node.apiUrl,
      apiKey: node.apiKey,
      inboundId: node.inboundId
    },
    config: {
      username,
      email: user.email,
      expiry: expiryDate,
      location: user.location,
      maxDevices: user.subscription.plan.maxDevices
    }
  };
});

fastify.post('/vpn/connect', { preHandler: verifyToken }, async (request, reply) => {
  const user = await prisma.user.findUnique({
    where: { id: request.user.id },
    include: { subscription: { include: { plan: true } } }
  });
  
  if (!user.subscription || user.subscription.status !== 'ACTIVE') {
    return reply.status(403).send({ error: 'No active subscription' });
  }
  
  const node = await selectNode(user.location);
  
  const username = `user-${user.id.slice(0, 8)}`;
  const expiryDate = user.subscription.endDate;
  
  const MarzbanURL = `${node.apiUrl}/api`;
  const response = await fetch(`${MarzbanURL}/user`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${node.apiKey}`
    },
    body: JSON.stringify({
      username,
      email: user.email,
      enable: true,
      inbounds: {
        [node.inboundId]: ['vless']
      },
      flow: 'xtls-rprx-vision',
      limit: user.subscription.plan.maxDevices,
      expiry: expiryDate.getTime()
    })
  });
  
  if (!response.ok) {
    const error = await response.text();
    return reply.status(500).send({ error: 'Failed to create user on node', details: error });
  }
  
  const userData = await response.json();
  const linkResponse = await fetch(`${MarzbanURL}/user/${username}/link`, {
    headers: { 'Authorization': `Bearer ${node.apiKey}` }
  });
  
  const link = await linkResponse.text();
  
  return { message: 'Connected', configLink: link, username };
});

fastify.post('/vpn/disconnect', { preHandler: verifyToken }, async (request, reply) => {
  const user = await prisma.user.findUnique({
    where: { id: request.user.id }
  });
  
  const nodes = await prisma.node.findMany({ where: { active: true } });
  
  const username = `user-${user.id.slice(0, 8)}`;
  
  for (const node of nodes) {
    try {
      const MarzbanURL = `${node.apiUrl}/api`;
      await fetch(`${MarzbanURL}/user/${username}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${node.apiKey}` }
      });
    } catch (e) {
      // Ignore errors
    }
  }
  
  return { message: 'Disconnected' };
});

// APK Routes
fastify.get('/apk/latest', async (request, reply) => {
  const apkPath = process.env.APK_STORAGE_PATH || './storage/apk/latest.apk';
  
  if (!fs.existsSync(apkPath)) {
    return { version: '1.0.0', size: 0, downloadUrl: '/apk/download' };
  }
  
  const stats = fs.statSync(apkPath);
  
  return {
    version: '1.0.0',
    size: stats.size,
    downloadUrl: '/apk/download'
  };
});

fastify.get('/apk/download', async (request, reply) => {
  const apkPath = process.env.APK_STORAGE_PATH || './storage/apk/latest.apk';
  
  if (!fs.existsSync(apkPath)) {
    return reply.status(404).send({ error: 'APK not found' });
  }
  
  const stream = fs.createReadStream(apkPath);
  
  reply.header('Content-Type', 'application/vnd.android.package-archive');
  reply.header('Content-Disposition', 'attachment; filename=avenyx.apk');
  
  return reply.send(stream);
});

// Admin Users Routes
fastify.get('/admin/users', { preHandler: verifyAdmin }, async (request, reply) => {
  const users = await prisma.user.findMany({
    include: { subscription: { include: { plan: true } } },
    orderBy: { createdAt: 'desc' }
  });
  
  return users;
});

fastify.get('/admin/users/:id', { preHandler: verifyAdmin }, async (request, reply) => {
  const { id } = request.params;
  
  const user = await prisma.user.findUnique({
    where: { id },
    include: { 
      subscription: { include: { plan: true } },
      paymentRequests: { include: { plan: true } },
      devices: true
    }
  });
  
  return user;
});

fastify.put('/admin/users/:id', { preHandler: verifyAdmin }, async (request, reply) => {
  const { id } = request.params;
  const { name, role, emailVerified } = request.body;
  
  const user = await prisma.user.update({
    where: { id },
    data: { name, role, emailVerified }
  });
  
  return user;
});

// Health check
fastify.get('/health', async () => {
  return { status: 'ok', timestamp: new Date().toISOString() };
});

// Start server
const start = async () => {
  try {
    await fastify.listen({ port: 3000, host: '0.0.0.0' });
    console.log('Server running on http://localhost:3000');
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();