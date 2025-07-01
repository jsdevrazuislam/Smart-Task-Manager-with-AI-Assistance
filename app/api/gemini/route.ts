import { NextResponse } from "next/server";

interface GeminiResponse {
  candidates?: Array<{
    content: {
      parts: Array<{
        text: string;
      }>;
    };
  }>;
  error?: {
    code: number;
    message: string;
    status: string;
  };
}

export async function POST(req: Request) {
  const { taskTitle, taskDescription } = await req.json();

  if (!taskTitle) {
    return NextResponse.json(
      { error: "Task title is required" },
      { status: 400 }
    );
  }

  try {
    const prompt = `
      Break down the following task into 3-5 smaller, actionable subtasks:
      Task: ${taskTitle}
      ${taskDescription ? `Description: ${taskDescription}` : ""}
      
      Return only the subtasks as a bulleted list without any additional commentary or numbering.
      Each subtask should start with a "- ".
    `;

    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`;

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: prompt,
              },
            ],
          },
        ],
      }),
    });

    const data: GeminiResponse = await response.json();

    if (!response.ok || data.error) {
      const errorMessage = data.error?.message || "Unknown API error";
      console.error("Gemini API error:", errorMessage);
      return NextResponse.json(
        { error: `Gemini API error: ${errorMessage}` },
        { status: response.status || 500 }
      );
    }

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";

    if (!text) {
      console.error("No text content in response:", data);
      return NextResponse.json(
        { error: "No subtasks were generated. Please try again." },
        { status: 500 }
      );
    }

    const subtasks = text
      .split("\n")
      .filter(
        (line: string) =>
          line.trim().startsWith("-") || line.trim().startsWith("*")
      )
      .map((line: string) => line.replace(/^[-*]\s*/, "").trim())
      .filter((line: string) => Boolean(line));

    if (subtasks.length === 0) {
      console.error("No valid subtasks found in response:", text);
      return NextResponse.json(
        {
          error:
            "Could not parse subtasks from the response. Please try again.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({ subtasks });
  } catch (error) {
    console.error("Error generating subtasks:", error);
    return NextResponse.json(
      {
        error: "Failed to generate subtasks",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}


