import prisma from '../lib/prisma';
import { getServerSession } from '@auth/next';
import { options } from '../lib/auth';

export default async function handler(req) {
  const session = await getServerSession(options);
  if (!session) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  const { method } = req;
  const path = Array.isArray(req.query.path) ? req.query.path.join('/') : req.query.path || '';

  try {
    switch (method) {
      case 'GET':
        return await handleGet(path, session.user);
      case 'POST':
        const body = await req.json();
        return await handlePost(path, body, session.user);
      case 'PUT':
        const updateBody = await req.json();
        return await handlePut(path, updateBody, session.user);
      case 'DELETE':
        return await handleDelete(path, session.user);
      default:
        return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
    }
  } catch (error) {
    console.error('API Error:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}

async function handleGet(path, user) {
  if (path === 'flights') {
    const flights = await prisma.flight.findMany({
      where: { userId: user.id },
      orderBy: { date: 'desc' }
    });
    return new Response(JSON.stringify({ data: flights }));
  }

  if (path === 'flight-groups') {
    const groups = await prisma.flightGroup.findMany({
      where: {
        members: {
          array_contains: { email: user.email }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    return new Response(JSON.stringify({ data: groups }));
  }

  if (path === 'users/me') {
    return new Response(JSON.stringify(user));
  }

  return new Response(JSON.stringify({ error: 'Not found' }), { status: 404 });
}

async function handlePost(path, data, user) {
  if (path === 'flights') {
    const flight = await prisma.flight.create({
      data: {
        ...data,
        userId: user.id,
        date: new Date(data.date)
      }
    });
    return new Response(JSON.stringify(flight));
  }

  if (path === 'flight-groups') {
    const group = await prisma.flightGroup.create({
      data: {
        ...data,
        createdById: user.id,
        adminEmail: user.email,
        members: [{ email: user.email, fullName: user.name }]
      }
    });
    return new Response(JSON.stringify(group));
  }

  return new Response(JSON.stringify({ error: 'Not found' }), { status: 404 });
}

async function handlePut(path, data, user) {
  const flightMatches = path.match(/flights\/([^\/]+)/);
  if (flightMatches) {
    const id = flightMatches[1];
    const flight = await prisma.flight.update({
      where: { 
        id,
        userId: user.id 
      },
      data: {
        ...data,
        date: new Date(data.date)
      }
    });
    return new Response(JSON.stringify(flight));
  }

  const groupMatches = path.match(/flight-groups\/([^\/]+)/);
  if (groupMatches) {
    const id = groupMatches[1];
    const group = await prisma.flightGroup.update({
      where: { 
        id,
        OR: [
          { adminEmail: user.email },
          { members: { array_contains: { email: user.email } } }
        ]
      },
      data
    });
    return new Response(JSON.stringify(group));
  }

  return new Response(JSON.stringify({ error: 'Not found' }), { status: 404 });
}

async function handleDelete(path, user) {
  const flightMatches = path.match(/flights\/([^\/]+)/);
  if (flightMatches) {
    const id = flightMatches[1];
    await prisma.flight.delete({
      where: { 
        id,
        userId: user.id 
      }
    });
    return new Response(null, { status: 204 });
  }

  const groupMatches = path.match(/flight-groups\/([^\/]+)/);
  if (groupMatches) {
    const id = groupMatches[1];
    await prisma.flightGroup.delete({
      where: { 
        id,
        adminEmail: user.email
      }
    });
    return new Response(null, { status: 204 });
  }

  return new Response(JSON.stringify({ error: 'Not found' }), { status: 404 });
}

export const config = {
  api: {
    bodyParser: false,
  },
};
      where: { id }
    });
    return res.json({ success: true });
  }
  return res.status(404).json({ error: 'Not found' });
}