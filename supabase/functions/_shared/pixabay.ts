export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

export async function getPixabayImage(query: string, apiKey: string): Promise<string> {
  try {
    const response = await fetch(
      `https://pixabay.com/api/?key=${apiKey}&q=${encodeURIComponent(query)}&image_type=photo&per_page=1`
    );

    if (!response.ok) {
      console.error(`Pixabay API error: ${response.status} ${response.statusText}`);
      return getDefaultImage();
    }

    const data = await response.json();
    
    if (!data.hits || data.hits.length === 0) {
      console.log(`No images found for query: ${query}`);
      return getDefaultImage();
    }

    return data.hits[0].largeImageURL;
  } catch (error) {
    console.error('Error fetching Pixabay image:', error);
    return getDefaultImage();
  }
}

function getDefaultImage(): string {
  return 'https://images.unsplash.com/photo-1519999482648-25049ddd37b1?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=2456&q=80';
}