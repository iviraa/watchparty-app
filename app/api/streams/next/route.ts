import { prismaClient } from "@/app/lib/db";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await getServerSession();
  const user = await prismaClient.user.findFirst({
    where: {
      email: session?.user?.email ?? "",
    },
  });

  if (!user) {
    return NextResponse.json({ message: "Not authenticated" }, { status: 405 });
  }

  const mostUpvotedStream = await prismaClient.stream.findFirst({
    where: {
      userId: user.id,
    },
    orderBy: {
      upvotes: {
        _count: "desc",
      },
    },
  });

  await Promise.all([
    prismaClient.currentStream.upsert({
      where: {
        userId: user.id,
      },
      update: {
        streamId: mostUpvotedStream?.id,
      },
      create: {
        userId: user.id,
        streamId: mostUpvotedStream?.id,
      },
    }),
    prismaClient.currentStream.delete({
      where: {
        streamId: mostUpvotedStream?.id ?? "",
      },
    }),
  ]);

  return NextResponse.json({
    stream: mostUpvotedStream,
  });
}
