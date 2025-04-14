
import React, { useState } from "react";
import { Card } from "@/components/ui/card";

interface VideoPlayerProps {
  videoUrl: string | undefined;
  title: string;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ videoUrl, title }) => {
  const [isLoading, setIsLoading] = useState(true);

  // Function to extract YouTube video ID from URL
  const getYoutubeEmbedUrl = (url: string): string => {
    if (!url) return "";
    
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    
    return (match && match[2].length === 11)
      ? `https://www.youtube.com/embed/${match[2]}?autoplay=0`
      : "";
  };

  if (!videoUrl) {
    return (
      <Card className="w-full aspect-video bg-muted flex items-center justify-center rounded-md">
        <p className="text-muted-foreground">No hay video disponible</p>
      </Card>
    );
  }

  const embedUrl = getYoutubeEmbedUrl(videoUrl);

  return (
    <div className="w-full">
      <Card className="overflow-hidden">
        {isLoading && (
          <div className="w-full aspect-video bg-muted flex items-center justify-center">
            <p className="text-muted-foreground">Cargando video...</p>
          </div>
        )}
        
        <iframe 
          src={embedUrl}
          title={title}
          className="w-full aspect-video"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          onLoad={() => setIsLoading(false)}
          style={{ display: isLoading ? "none" : "block" }}
        ></iframe>
      </Card>
    </div>
  );
};

export default VideoPlayer;
