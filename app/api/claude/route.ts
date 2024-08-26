// app/api/claude/route.ts

import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { messages, apiKey } = await request.json();

    if (!messages || !apiKey) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: "claude-3-opus-20240229",
        max_tokens: 1024,
        messages: messages,
        temperature: 0.7,
      })
    });

    if (!response.ok) {
      throw new Error(`Anthropic API responded with status: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error calling Claude API:', error);
    return NextResponse.json({ error: 'Error calling Claude API' }, { status: 500 });
  }
}