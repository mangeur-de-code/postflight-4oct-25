import { NextResponse } from 'next/server';
import prisma from '../lib/prisma';
import { verifyAuth } from '../lib/auth';

export const config = {
  runtime: 'edge',
};

// Middleware to verify authentication
async function withAuth(req, handler) {
  const authHeader = req.headers.get('authorization');
  if (!authHeader) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  try {
    const user = await verifyAuth(authHeader);
    return handler(req, user);
  } catch (error) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}

export default async function handler(req) {
  return withAuth(req, async (req, user) => {
    const { method } = req;
    const url = new URL(req.url);
    const path = url.pathname.replace('/api/', '');

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
          return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
      }
    } catch (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  });
}

async function handleGet(path, params) {
  if (path === 'flights') {
    const flights = await prisma.flight.findMany({
      where: {
        userId: params.get('userId')
      },
      orderBy: { date: 'desc' }
    });
    return NextResponse.json({ data: flights });
  }
  throw new Error('Not found');
}

async function handlePost(path, body) {
  if (path === 'flights') {
    const flight = await prisma.flight.create({
      data: {
        ...body,
        date: new Date(body.date)
      }
    });
    return NextResponse.json(flight);
  }
  throw new Error('Not found');
}

async function handlePut(path, body) {
  const matches = path.match(/flights\/([^\/]+)/);
  if (matches) {
    const id = matches[1];
    const flight = await prisma.flight.update({
      where: { id },
      data: {
        ...body,
        date: new Date(body.date)
      }
    });
    return NextResponse.json(flight);
  }
  throw new Error('Not found');
}

async function handleDelete(path) {
  const matches = path.match(/flights\/([^\/]+)/);
  if (matches) {
    const id = matches[1];
    await prisma.flight.delete({
      where: { id }
    });
    return NextResponse.json({ success: true });
  }
  throw new Error('Not found');
}