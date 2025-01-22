interface Section {
  title: string;
  content: string;
}

interface CityData {
  name: string;
  bundesland: string;
}

interface CacheContent {
  cityName: string;
  bundesland: string;
  title: string;
  description: string;
  introduction: string;
  images: string[];
  sections: Section[];
  datingSites: Array<{
    name: string;
    description: string;
    link: string;
  }>;
}