export type Model = 'GPT' | 'Claude' | 'LLaMA' | 'Mixtral';

export const models: Model[] = ['GPT', 'Claude', 'LLaMA', 'Mixtral'];

export type ApiKeys = {
  [key in Model]: string;
};

export type SelectedModels = {
  [key in Model]: boolean;
};

export type Output = {
  model: Model;
  text: string;
  isLoading: boolean;
};

const parseRephrasings = (text: string): string[] => {
  const lines = text.split('\n');
  const rephrasings = lines.filter(line => 
    /^\d+[\.\)]/.test(line.trim()) || // Matches numbered lines (1. or 1))
    /^[-•*]/.test(line.trim())        // Matches bulleted lines
  ).map(line => line.replace(/^[^a-zA-Z]+/, '').trim()); // Remove numbering/bullets
  
  // If no structured rephrasings found, return all non-empty lines
  return rephrasings.length > 0 ? rephrasings : lines.filter(line => line.trim() !== '');
};

const callGPTAPI = async (prompt: string, apiKey: string): Promise<string[]> => {
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
  return parseRephrasings(data.choices[0].message.content);
};


const callClaudeAPI = async (prompt: string, apiKey: string): Promise<string[]> => {
  try {
    const response = await fetch('/api/claude', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ messages: [{ role: 'user', content: prompt }], apiKey }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.content && Array.isArray(data.content) && data.content.length > 0) {
      const textContent = data.content.find((item: any) => item.type === 'text');
      if (textContent && textContent.text) {
        return parseRephrasings(textContent.text);
      }
    }
    
    throw new Error('Unexpected response format from Claude API');
  } catch (error) {
    console.error('Error calling Claude API:', error);
    throw error;
  }
};

const callLLaMAAPI = async (prompt: string, apiKey: string): Promise<string[]> => {
  // Placeholder for LLaMA API call
  return ["LLaMA reformulation 1", "LLaMA reformulation 2", "LLaMA reformulation 3"];
};

const callMixtralAPI = async (prompt: string, apiKey: string): Promise<string[]> => {
  // Placeholder for Mixtral API call
  return ["Mixtral reformulation 1", "Mixtral reformulation 2", "Mixtral reformulation 3"];
};

export const fetchReformulations = async (
  input: string,
  model: Model,
  apiKeys: ApiKeys,
  outputsPerModel: number,
  prompt: string
): Promise<Output[]> => {
  const results: Output[] = [];
  prompt = prompt.replace('{input}', input).replace('{count}', outputsPerModel.toString());
  console.log(prompt)
  try {
    let reformulations: string[];
    switch (model) {
      case 'GPT':
        reformulations = await callGPTAPI(prompt, apiKeys[model]);
        break;
      case 'Claude':
        reformulations = await callClaudeAPI(prompt, apiKeys[model]);
        break;
      case 'LLaMA':
        reformulations = await callLLaMAAPI(prompt, apiKeys[model]);
        break;
      case 'Mixtral':
        reformulations = await callMixtralAPI(prompt, apiKeys[model]);
        break;
    }
    results.push(...reformulations.slice(0, outputsPerModel).map(text => ({ model, text, isLoading: false })));
  } catch (error) {
    console.error(`Error fetching reformulations from ${model}:`, error);
    results.push({ model, text: `Error: Unable to fetch reformulations from ${model}`, isLoading: false });
  }

  return results;
};