import { prismaClient } from "@/app/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

//@ts-ignore
import youtubesearchapi from "youtube-search-api";
import { YT_REGEX } from "@/app/lib/utils";
import { getServerSession } from "next-auth";

const CreateStreamSchema = z.object({
  creatorId: z.string(),
  url: z.string(),
});

export async function POST(req: NextRequest) {
  try {
    const data = CreateStreamSchema.parse(await req.json());
    const isYt = data.url.match(YT_REGEX);

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

    const res = await youtubesearchapi.GetVideoDetails(extractedId);
    console.log(res.title);
    console.log(res.thumbnail.thumbnails);
    const thumbnails = res.thumbnail.thumbnails;
    thumbnails.sort((a: { width: number }, b: { width: number }) =>
      a.width < b.width ? -1 : 1
    );

    const stream = await prismaClient.stream.create({
      data: {
        userId: data.creatorId,
        url: data.url,
        extractedId,
        type: "Youtube",
        title: res.title ?? "",
        smallImg:
          (thumbnails.length > 1
            ? thumbnails[thumbnails.length - 2].url
            : thumbnails[thumbnails.length - 1].url) ?? "",
        bigImg: thumbnails[thumbnails.length - 1].url ?? "",
      },
    });

    return NextResponse.json({
      ...stream,
      hasUpvoted: false,
      upvotes: 0,
    });
  } catch (error) {
    return NextResponse.json(
      {
        message: "An error occured",
      },
      {
        status: 400,
      }
    );
  }
}

export async function GET(req: NextRequest) {
  const creatorId = req.nextUrl.searchParams.get("creatorId");

  const session = await getServerSession();
  const user = await prismaClient.user.findFirst({
    where: {
      email: session?.user?.email ?? "",
    },
  });

  if (!user) {
    return NextResponse.json({ message: "Not authenticated" }, { status: 405 });
  }

  if (!creatorId) {
    return NextResponse.json({
      message: "Missing creatorId",
    });
  }

  const [streams, activeStream] = await Promise.all([
    await prismaClient.stream.findMany({
      where: {
        userId: creatorId,
      },
      include: {
        _count: {
          select: {
            upvotes: true,
          },
        },
        upvotes: {
          where: {
            userId: user.id,
          },
        },
      },
    }),
    prismaClient.currentStream.findFirst({
      where: {
        userId: creatorId,
      },
      include: {
        stream: true,
      },
    }),
  ]);

  return NextResponse.json({
    streams: streams.map(({ _count, ...rest }) => ({
      ...rest,
      upvotes: _count.upvotes,
      haveUpvoted: rest.upvotes.length ? true : false,
    })),
    activeStream: activeStream,
  });
}
