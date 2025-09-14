import React, { useState, useEffect } from 'react';
import * as api from '../utils/db.ts';

interface PersistentImageProps {
  imageId: string;
  className?: string;
  alt: string;
}

const PersistentImage: React.FC<PersistentImageProps> = ({ imageId, className, alt }) => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let objectUrl: string | null = null;

    const fetchImage = async () => {
      if (!imageId) {
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      try {
        const blob = await api.getImageBlob(imageId);
        if (blob) {
          objectUrl = URL.createObjectURL(blob);
          setImageUrl(objectUrl);
        }
      } catch (error) {
        console.error("Failed to load image from API", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchImage();

    // Cleanup function to revoke the object URL and prevent memory leaks
    return () => {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [imageId]);

  if (isLoading) {
    return (
      <div className={`flex items-center justify-center bg-lino rounded-md ${className}`}>
        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-oliva"></div>
      </div>
    );
  }

  if (!imageUrl) {
    return (
      <div className={`flex items-center justify-center bg-lino text-oliva text-xs rounded-md ${className}`}>
        <span>No Img</span>
      </div>
    );
  }

  return <img src={imageUrl} alt={alt} className={className} />;
};

export default PersistentImage;