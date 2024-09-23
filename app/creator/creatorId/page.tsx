import StreamView from "@/app/components/StreamView";

export default function ({
  params: { creatorId },
}: {
  params: {
    creatorId: string;
  };
}) {
  return (
    console.log(creatorId),
    (
      <div>
        <StreamView creatorId={creatorId} />
      </div>
    )
  );
}
