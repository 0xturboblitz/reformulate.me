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

const callAPI = async (model: Model, prompt: string, apiKey?: string): Promise<string[]> => {
  try {
    const response = await fetch('/api/reformulate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ model, prompt, apiKey }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return parseRephrasings(data.content);
  } catch (error) {
    console.error(`Error calling ${model} API:`, error);
    throw error;
  }
};

export const fetchReformulations = async (
  model: Model,
  apiKeys: ApiKeys,
  prompt: string
): Promise<Output[]> => {
  const results: Output[] = [];
  console.log(prompt)
  try {
    const reformulations = await callAPI(model, prompt, apiKeys[model]);
    results.push(...reformulations.map(text => ({ model, text, isLoading: false })));
  } catch (error) {
    console.error(`Error fetching reformulations from ${model}:`, error);
    results.push({ model, text: `Error: Unable to fetch reformulations from ${model}`, isLoading: false });
  }

  return results;
};