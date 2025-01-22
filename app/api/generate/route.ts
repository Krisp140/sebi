import { NextResponse } from 'next/server';
import Replicate from 'replicate';

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

interface ComicPanel {
  prompt: string;
  caption: string;
}

interface ComicStory {
  comics: ComicPanel[];
}

export async function POST(request: Request) {
  try {
    const { prompt } = await request.json();
    
    // Generate story using OpenAI
    const response = await fetch('https://models.inference.ai.azure.com/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GITHUB_TOKEN}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: `You are a comic story generator. Generate a 3-panel comic story about a dog's adventure.
            
            IMPORTANT: Respond ONLY with a JSON object in this exact format:
            {
              "comics": [
                {
                  "prompt": "Image generation prompt here that MUST include 'sebi brown dog' and end with 'realistic style, contrasting colors'",
                  "caption": "Caption text here that refers to the male dog as 'sebi'"
                }
              ]
            }
            Do not include any other text or explanation in your response.`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        response_format: { "type": "json_object" }  // Force JSON response
      })
    });

    const storyData = await response.json();
    console.log('Story Data:', storyData);

    if (!storyData.choices?.[0]?.message?.content) {
      throw new Error('Invalid API response format');
    }

    // Parse the JSON response
    const content = JSON.parse(storyData.choices[0].message.content);
    console.log('Parsed content:', content);

    if (!content.comics || !Array.isArray(content.comics)) {
      throw new Error('Invalid story format');
    }

    // Generate images using the latest version
    const generatedPanels = await Promise.all(
      content.comics.map(async (panel) => {
        try {
          const output = await replicate.run(
            "sundai-club/sebi:4a7c8116010cc98ff8fc16c81c29f857f67b1ca62b74cbba6ea53832c3bc9ee4",
            {
              input: {
                prompt: panel.prompt,
                model: "schnell",
                num_inference_steps: 8
              }
            }
          );

          console.log('Replicate output:', output);
          const img_url = String(output);
          return NextResponse.json({ imageUrl: img_url});
        } catch (error) {
          console.error('Error generating image for prompt:', panel.prompt, error);
          throw error;
        }
      })
    );

    return NextResponse.json({ panels: generatedPanels });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Failed to generate comic' },
      { status: 500 }
    );
  }
} 