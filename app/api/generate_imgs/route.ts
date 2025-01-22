import { NextResponse } from 'next/server';
import Replicate from "replicate";

const replicate = new Replicate({
    auth: process.env.REPLICATE_API_TOKEN,
});

export async function POST(req: Request) {
  try {
    const { prompt } = await req.json();

    if (!prompt) {
      return NextResponse.json(
        { error: "Prompt is required" },
        { status: 400 }
      );
    }

    console.log("Running the model...");
    const output = await replicate.run(
      "sundai-club/sebi:4a7c8116010cc98ff8fc16c81c29f857f67b1ca62b74cbba6ea53832c3bc9ee4",
      {
        input: {
          prompt: prompt,
          num_inference_steps: 8,
          model: "schnell"
        }
      }
    );

    const img_url = String(output);
    return NextResponse.json({ imageUrl: img_url });

  } catch (error) {
    console.error('Error generating image:', error);
    return NextResponse.json(
      { error: "Failed to generate image" },
      { status: 500 }
    );
  }
} 