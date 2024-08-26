"use client"

import React, { useState, useEffect, useCallback } from 'react';
import { Settings, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { models, Model, ApiKeys, SelectedModels, Output, fetchReformulations } from '../lib/models';
import { LoadingSpinner } from '@/components/ui/spinner';

export default function Home() {
  const [input, setInput] = useState('');
  const [outputs, setOutputs] = useState<Output[]>([]);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [apiKeys, setApiKeys] = useState<ApiKeys>(() => ({
    GPT: '',
    Claude: '',
    LLaMA: '',
    Mixtral: ''
  }));
  const [apiKeyVisibility, setApiKeyVisibility] = useState<{ [key in Model]: boolean }>({
    GPT: false,
    Claude: false,
    LLaMA: false,
    Mixtral: false
  });
  const [selectedModels, setSelectedModels] = useState<SelectedModels>({
    'GPT': true,
    'Claude': true,
    'LLaMA': false,
    'Mixtral': false
  });
  const [outputsPerModel, setOutputsPerModel] = useState(3);
  const [isCrazyMode, setIsCrazyMode] = useState(false);
  const [sourceLanguage, setSourceLanguage] = useState('');
  const [prompts, setPrompts] = useState<{ [key in Model]: string }>({
    GPT: "Reformulate the following text: '{input}'. Provide {count} different reformulations. Format your response as a numbered list.",
    Claude: "Please provide {count} different ways to rephrase the following text: '{input}'. Present your response as a bulleted list.",
    LLaMA: "Generate {count} alternative phrasings for the given text: '{input}'. Format each rephrasing as a separate numbered item.",
    Mixtral: "Rewrite the following text in {count} different ways: '{input}'. Present each rewrite as a bullet point."
  });

  const getPrompt = useCallback((model: Model) => {
    let basePrompt = prompts[model];
    if (sourceLanguage) {
      basePrompt = `Translate the following ${sourceLanguage} text to English, then ${basePrompt.toLowerCase()}`;
    }
    if (isCrazyMode) {
      basePrompt = basePrompt.replace(": '{input}'", " in a crazier way: '{input}'");
    }

    return basePrompt.replace('{input}', input).replace('{count}', outputsPerModel.toString());
  }, [prompts, isCrazyMode, sourceLanguage, input, outputsPerModel]);

  const handleFetchReformulations = useCallback(async () => {
    if (input) {
      setOutputs(
        Object.keys(selectedModels)
          .filter(model => selectedModels[model as Model])
          .flatMap((model: any) => (new Array(outputsPerModel).fill({ model, text: '', isLoading: true })))
      );

      await Promise.all(
        models.map(async (model) => {
          if (selectedModels[model]) {
            try {
              const modelOutputs = await fetchReformulations(
                model,
                apiKeys,
                getPrompt(model)
              );
              setOutputs(prevOutputs => {
                const updatedOutputs = [...prevOutputs];
                const modelIndex = updatedOutputs.findIndex(output => output.model === model);
                if (modelIndex !== -1) {
                  updatedOutputs.splice(modelIndex, outputsPerModel, ...modelOutputs);
                } else {
                  updatedOutputs.push(...modelOutputs);
                }
                return updatedOutputs;
              });
            } catch (error) {
              console.error(`Error fetching reformulations from ${model}:`, error);
              setOutputs(prev => [...prev, { model, text: `Error: Unable to fetch reformulations from ${model}`, isLoading: false }]);
            }
          }
          return [];
        })
      );
    }
  }, [input, selectedModels, apiKeys, outputsPerModel, getPrompt]);

  useEffect(() => {
    const timer = setTimeout(() => {
      handleFetchReformulations();
    }, 1000);

    return () => clearTimeout(timer);
  }, [input, handleFetchReformulations]);

  const handleApiKeyChange = (model: Model, key: string) => {
    setApiKeys(prev => ({ ...prev, [model]: key }));
  };

  const handleModelToggle = (model: Model) => {
    setSelectedModels(prev => ({ ...prev, [model]: !prev[model] }));
  };

  const toggleApiKeyVisibility = (model: Model) => {
    setApiKeyVisibility(prev => ({ ...prev, [model]: !prev[model] }));
  };

  const handleKeyPress = (e: any) => {
    if (e.key === 'Enter') {
      handleFetchReformulations();
    }
  };

  return (
    <div className="container mx-auto p-4">
      <div className="mb-4">
        <Input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Type your sentence here..."
          className="w-full p-2"
        />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {outputs.map((output, index) => (
          <Card key={index}>
            <CardHeader>
              <CardTitle>{output.model}</CardTitle>
            </CardHeader>
            <CardContent>
              {output.isLoading ? (
                <div className="flex items-center justify-center h-32">
                  <LoadingSpinner className="w-8 h-8" />
                </div>
              ) : (
                output.text
              )}
            </CardContent>
          </Card>
        ))}
      </div>
      <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
        <DialogTrigger asChild>
          <Button className="mt-4">
            <Settings className="mr-2 h-4 w-4" /> Settings
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Settings</DialogTitle>
          </DialogHeader>
          <ScrollArea className="h-[80vh] pr-4">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">API Keys (Optional)</h3>
              {models.map(model => (
                <div key={model} className="flex items-center space-x-2">
                  <Label htmlFor={`${model}-api-key`} className="w-20">{model}</Label>
                  <div className="relative flex-grow">
                    <Input
                      id={`${model}-api-key`}
                      type={apiKeyVisibility[model] ? "text" : "password"}
                      value={apiKeys[model] || ''}
                      onChange={(e) => handleApiKeyChange(model, e.target.value)}
                      placeholder={`Enter ${model} API Key (optional)`}
                      className="pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute inset-y-0 right-0 px-3 flex items-center"
                      onClick={() => toggleApiKeyVisibility(model)}
                    >
                      {apiKeyVisibility[model] ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              ))}
              <h3 className="text-lg font-semibold">Models</h3>
              {models.map(model => (
                <div key={model} className="flex items-center space-x-2">
                  <Switch
                    id={`${model}-toggle`}
                    checked={selectedModels[model]}
                    onCheckedChange={() => handleModelToggle(model)}
                  />
                  <Label htmlFor={`${model}-toggle`}>{model}</Label>
                </div>
              ))}
              <div>
                <Label htmlFor="outputs-per-model">Outputs per model</Label>
                <Input
                  id="outputs-per-model"
                  type="number"
                  value={outputsPerModel}
                  onChange={(e) => setOutputsPerModel(Number(e.target.value))}
                  min="1"
                  max="10"
                />
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="crazy-mode-toggle"
                  checked={isCrazyMode}
                  onCheckedChange={setIsCrazyMode}
                />
                <Label htmlFor="crazy-mode-toggle">Crazy Mode</Label>
              </div>
              <div>
                <Label htmlFor="source-language">Source Language</Label>
                <Input
                  id="source-language"
                  type="text"
                  value={sourceLanguage}
                  onChange={(e) => setSourceLanguage(e.target.value)}
                  placeholder="Enter source language (e.g., French)"
                />
              </div>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
};
