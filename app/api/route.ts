import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prismaClient } from "../lib/db";
const YT_REGEX = new RegExp("https:\/\/www\.youtube\.com\/watch\?v=[\w-]+");

const CreateStreamSchema = z.object({
  streamer: z.string(),
  url: z.string(),
});

export async function POST(req: NextRequest) {
  try {
    const data = CreateStreamSchema.parse(await req.json());
    const isYt = YT_REGEX.test(data.url);

    if (!isYt) {
      return NextResponse.json(
        {
          message: "Invalid url",
        },
        {
          status: 411,
        }
      );
    }

    const extractedId = data.url.split("?v=")[1];

    await prismaClient.stream.create({
      data: {
        userId: data.streamer,
        url: data.url,
        extractedId,
        type: "Youtube",
      },
    });
  } catch (error) {
    return NextResponse.json(
      { message: "An error occured when creating stream" },
      { status: 411 }
    );
  }
}
