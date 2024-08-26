// app/api/reformulate/route.ts

import { NextResponse } from 'next/server';

const GPT_API_KEY = process.env.GPT_API_KEY;
const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY;

const callGPTAPI = async (prompt: string, apiKey: string): Promise<string> => {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
    })
  });
  const data = await response.json();
  return data.choices[0].message.content;
};

const callClaudeAPI = async (prompt: string, apiKey: string): Promise<string> => {
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
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
    })
  });
  const data = await response.json();
  return data.content[0].text;
};

export async function POST(request: Request) {
  try {
    const { model, prompt, apiKey } = await request.json();

    console.log('request:', {model, prompt});

    if (!model || !prompt) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    let content: string;
    let selectedApiKey: string;

    switch (model) {
      case 'GPT':
        selectedApiKey = apiKey || GPT_API_KEY;
        if (!selectedApiKey) {
          return NextResponse.json({ error: 'No API key provided for GPT' }, { status: 400 });
        }
        content = await callGPTAPI(prompt, selectedApiKey);
        break;
      case 'Claude':
        selectedApiKey = apiKey || CLAUDE_API_KEY;
        if (!selectedApiKey) {
          return NextResponse.json({ error: 'No API key provided for Claude' }, { status: 400 });
        }
        content = await callClaudeAPI(prompt, selectedApiKey);
        break;
      default:
        return NextResponse.json({ error: 'Invalid model specified' }, { status: 400 });
    }

    return NextResponse.json({ content });
  } catch (error) {
    console.error('Error in API route:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}