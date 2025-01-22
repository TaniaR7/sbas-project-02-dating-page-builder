import { createSupabaseClient } from "./supabase-client.ts";
import { getPixabayImage } from "./pixabay.ts";

export async function downloadAndStoreImage(imageUrl: string, citySlug: string, index: number, supabase: any): Promise<string> {
  try {
    console.log(`Downloading image from ${imageUrl} for ${citySlug}`);
    const response = await fetch(imageUrl);
    if (!response.ok) throw new Error(`Failed to download image: ${response.statusText}`);

    const blob = await response.blob();
    const fileExt = imageUrl.split('.').pop()?.toLowerCase() || 'jpg';
    const fileName = `${citySlug}-${index}.${fileExt}`;
    const filePath = `${citySlug}/${fileName}`;

    const { data: uploadData, error: uploadError } = await supabase
      .storage
      .from('city_images')
      .upload(filePath, blob, {
        contentType: `image/${fileExt}`,
        upsert: true
      });

    if (uploadError) {
      console.error('Error uploading image:', uploadError);
      return imageUrl;
    }

    const { data: { publicUrl } } = supabase
      .storage
      .from('city_images')
      .getPublicUrl(filePath);

    console.log(`Successfully stored image at ${publicUrl}`);
    return publicUrl;
  } catch (error) {
    console.error('Error in downloadAndStoreImage:', error);
    return imageUrl;
  }
}

export async function getCityImages(cityName: string, citySlug: string, supabase: any) {
  console.log("Fetching images from Pixabay for", cityName);
  const pixabayImages = await Promise.all([
    getPixabayImage(cityName, Deno.env.get("PIXABAY_API_KEY")!),
    getPixabayImage(`${cityName} city`, Deno.env.get("PIXABAY_API_KEY")!)
  ]);

  return Promise.all(
    pixabayImages
      .filter(Boolean)
      .slice(0, 2)
      .map((imageUrl, index) => downloadAndStoreImage(imageUrl, citySlug, index + 1, supabase))
  );
}