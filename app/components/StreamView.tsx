"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { ThumbsUp, ThumbsDown, Plus, SkipForward, Share2 } from "lucide-react";
import { toast, ToastContainer } from "react-toastify";
import LiteYouTubeEmbed from "react-lite-youtube-embed";
import { YT_REGEX } from "../lib/utils";
import { Appbar } from "../components/Appbar";

interface Video {
  id: string;
  type: string;
  url: string;
  extractedId: string;
  title: string;
  smallImg: string;
  bigImg: string;
  active: boolean;
  userId: string;
  upvotes: number;
  haveUpvoted: boolean;
}

const REFRESH_INTERVAL_MS = 10 * 1000;

export default function StreamView({
  creatorId,
  playVideo = false,
}: {
  creatorId: string;
  playVideo: boolean;
}) {
  const [inputLink, setInputLink] = useState("");
  const [queue, setQueue] = useState<Video[]>([]);
  const [currentVideo, setCurrentVideo] = useState<Video | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function refreshStreams() {
    const res = await fetch(`/api/streams/?creatorId=${creatorId}`, {
      credentials: "include",
    });
    const json = await res.json();
    setQueue(
      json.streams.sort((a: any, b: any) => (a.upvotes < b.upvotes ? 1 : -1))
    );
    setCurrentVideo(json.activeStream);
  }

  useEffect(() => {
    refreshStreams();
    const interval = setInterval(() => {
      refreshStreams();
    }, REFRESH_INTERVAL_MS);
  }, []);

  const handleAddVideo = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    const res = await fetch(`/api/streams/`, {
      method: "POST",
      body: JSON.stringify({
        creatorId,
        url: inputLink,
      }),
    });
    setQueue([...queue, await res.json()]);
    setIsLoading(false);
    setInputLink("");
  };

  const handleVote = (id: string, isUpvote: boolean) => {
    setQueue(
      queue
        .map((video) =>
          video.id === id
            ? {
                ...video,
                upvotes: isUpvote ? video.upvotes + 1 : video.upvotes - 1,
                haveUpvoted: !video.haveUpvoted,
              }
            : video
        )
        .sort((a, b) => b.upvotes - a.upvotes)
    );

    fetch(`/api/streams/${isUpvote ? "upvotes" : "downvotes"}`, {
      method: "POST",
      body: JSON.stringify({ streamId: id }),
    });
  };

  const playNextVideo = async () => {
    if (queue.length > 0) {
      const data = await fetch(`/api/streams//next`, {
        method: "GET",
      });
      const json = await data.json();
      setCurrentVideo(json.stream);
    }
  };

  const handleShare = () => {
    const shareUrl = `${window.location.hostname}/creator/${creatorId}`;
    navigator.clipboard.writeText(shareUrl).then(
      () => {
        toast.success("Share link copied to clipboard!", {
          position: "top-right",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
        });
      },
      (err) => {
        console.error("Could not copy text: ", err);
        toast.error("Failed to copy share link", {
          position: "top-right",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
        });
      }
    );
  };

  return (
    <div className="px-2">
      <Appbar />
      <div className="flex flex-col min-h-screen bg-background text-foreground container mx-auto max-w-xl px-4 ">
        <div className="flex justify-between items-center p-4 border-b">
          <span className="ml-2 text-xl font-bold ">WatchParty</span>

          <Button onClick={handleShare} className="ml-2">
            <Share2 className="mr-2 h-4 w-4" /> Share
          </Button>
        </div>

        <div className="space-y-4">
          <Card>
            <CardContent className="p-4">
              {currentVideo ? (
                <div>
                  {playVideo ? (
                    <>
                      <iframe
                        src={`https://www.youtube.com/embed/${currentVideo.id}?autoplay=1`}
                        allow="autoplay"
                      ></iframe>
                    </>
                  ) : (
                    <>
                      <img
                        src={currentVideo.bigImg}
                        className="w-24 h-18 object-cover rounded mr-4 cursor-pointer"
                      />
                      <p className="mt-2 text-center font-semibold py-8">
                        {currentVideo.title}
                      </p>
                    </>
                  )}
                </div>
              ) : (
                <p className="text-center py-8">No video playing</p>
              )}
            </CardContent>
          </Card>
        </div>

        <div>
          {inputLink && inputLink.match(YT_REGEX) && !isLoading && (
            <Card>
              <CardContent className="p-4">
                <LiteYouTubeEmbed title="" id={inputLink.split("?v=")[1]} />
              </CardContent>
            </Card>
          )}
        </div>

        <div className="py-4">
          <form onSubmit={handleAddVideo} className="flex ">
            <Input
              name="input"
              type="text"
              placeholder="Paste URL"
              value={inputLink}
              onChange={(e) => setInputLink(e.target.value)}
              className="flex-grow "
            />

            <Button disabled={isLoading} onClick={handleAddVideo} type="submit">
              {isLoading ? <span></span> : <Plus className="mr-2 h-4 w-4" />}
              {isLoading ? "Loading..." : "Add"}
            </Button>
          </form>

          {playVideo && (
            <Button onClick={playNextVideo} className="w-full mt-2">
              <SkipForward className="mr-2  h-4 w-4" /> Play Next
            </Button>
          )}
        </div>

        <div className="space-y-4">
          <h2 className="text-2xl font-bold">Queue</h2>
          {queue.map((video) => (
            <Card key={video.id} className="border-primary/10">
              <CardContent className="p-4 flex items-center space-x-4">
                <img
                  src={video.smallImg}
                  alt={`Thumbnail for ${video.title}`}
                  className="w-24 h-18 object-cover rounded cursor-pointer"
                />

                <div className="flex-grow">
                  <h3 className="text-lg font-semibold">{video.title}</h3>
                  <div className="flex items-center space-x-1 mt-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        handleVote(video.id, video.haveUpvoted ? false : true)
                      }
                      className="flex items-center space-x-1 border-primary/10 hover:bg-primary/10"
                    >
                      {video.haveUpvoted ? (
                        <ThumbsUp className="h-4 w-4 mr-1" />
                      ) : (
                        <ThumbsDown className="h-4 w-4 mr-1" />
                      )}
                      <span>{video.upvotes}</span>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <ToastContainer
          icon={false}
          theme="colored"
          position="top-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
        />
      </div>
    </div>
  );
}
