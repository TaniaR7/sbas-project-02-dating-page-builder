export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

export async function getPixabayImage(query: string, apiKey: string): Promise<string> {
  console.log('Starting Pixabay image fetch for query:', query);
  
  if (!query || !apiKey) {
    console.log('Missing query or API key, returning default image');
    return getDefaultImage();
  }

  try {
    // Clean the query to use just the city name
    const cleanQuery = encodeURIComponent(query.trim());
    const url = `https://pixabay.com/api/?key=${apiKey}&q=${cleanQuery}&image_type=photo&per_page=1`;
    console.log('Fetching Pixabay image with URL:', url);
    
    const response = await fetch(url);

    if (!response.ok) {
      console.error(`Pixabay API error: ${response.status} ${response.statusText}`);
      return getDefaultImage();
    }

    const data = await response.json();
    
    if (!data.hits || data.hits.length === 0) {
      console.log(`No images found for query: ${query}`);
      return getDefaultImage();
    }

    console.log('Successfully fetched image from Pixabay');
    return data.hits[0].largeImageURL;
  } catch (error) {
    console.error('Error fetching Pixabay image:', error);
    return getDefaultImage();
  }
}

function getDefaultImage(): string {
  // Return one of several default images randomly to ensure variety
  const defaultImages = [
    'https://images.unsplash.com/photo-1519999482648-25049ddd37b1',
    'https://images.unsplash.com/photo-1488590528505-98d2b5aba04b',
    'https://images.unsplash.com/photo-1518770660439-4636190af475',
    'https://images.unsplash.com/photo-1461749280684-dccba630e2f6',
    'https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d'
  ];
  
  const randomIndex = Math.floor(Math.random() * defaultImages.length);
  return defaultImages[randomIndex];
}