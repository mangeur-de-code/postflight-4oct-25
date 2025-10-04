import prisma from '../l      switch (method) {
        case 'GET':
          return await handleGet(path, req, res);
        case 'POST':
          return await handlePost(path, req, res);
        case 'PUT':
          return await handlePut(path, req, res);
        case 'DELETE':
          return await handleDelete(path, req, res);
        default:
          return res.status(405).json({ error: 'Method not allowed' });import { verifyAuth } from '../lib/auth';

// Middleware to verify authentication
async function withAuth(req, res, handler) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  try {
    const user = await verifyAuth(authHeader);
    return handler(req, res, user);
  } catch (error) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
}

export default async function handler(req, res) {
  return withAuth(req, res, async (req, res, user) => {
    const { method } = req;
    const path = Array.isArray(req.query.path) ? req.query.path.join('/') : req.query.path || '';

    try {
      switch (method) {
        case 'GET':
          return await handleGet(path, url.searchParams);
        case 'POST':
          const body = await req.json();
          return await handlePost(path, body);
        case 'PUT':
          const updateBody = await req.json();
          return await handlePut(path, updateBody);
        case 'DELETE':
          return await handleDelete(path);
        default:
          return res.status(405).json({ error: 'Method not allowed' });
      }
    } catch (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  });
}

async function handleGet(path, req, res) {
  if (path === 'flights') {
    const flights = await prisma.flight.findMany({
      where: {
        userId: req.query.userId
      },
      orderBy: { date: 'desc' }
    });
    return res.json({ data: flights });
  }
  return res.status(404).json({ error: 'Not found' });
}

async function handlePost(path, req, res) {
  if (path === 'flights') {
    const flight = await prisma.flight.create({
      data: {
        ...req.body,
        date: new Date(req.body.date)
      }
    });
    return res.json(flight);
  }
  return res.status(404).json({ error: 'Not found' });
}

async function handlePut(path, req, res) {
  const matches = path.match(/flights\/([^\/]+)/);
  if (matches) {
    const id = matches[1];
    const flight = await prisma.flight.update({
      where: { id },
      data: {
        ...req.body,
        date: new Date(req.body.date)
      }
    });
    return res.json(flight);
  }
  return res.status(404).json({ error: 'Not found' });
}

async function handleDelete(path, req, res) {
  const matches = path.match(/flights\/([^\/]+)/);
  if (matches) {
    const id = matches[1];
    await prisma.flight.delete({
      where: { id }
    });
    return res.json({ success: true });
  }
  return res.status(404).json({ error: 'Not found' });
}