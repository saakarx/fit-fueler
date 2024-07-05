export type MealTimeT = 'breakfast' | 'lunch' | 'dinner' | 'snacks';

export interface GetWorkoutsResponse {
  count: number;
  next: string;
  previous: any;
  results: Result[];
}

interface Result {
  id: number;
  uuid: string;
  created: string;
  last_update: string;
  last_update_global: string;
  category: Category;
  muscles: Muscle[];
  muscles_secondary: any[];
  equipment: Equipment[];
  license: License;
  license_author: string;
  images: any[];
  exercises: Exercise[];
  variations?: number;
  videos: Video[];
  author_history: string[];
  total_authors_history: string[];
}

interface Category {
  id: number;
  name: string;
}

interface Muscle {
  id: number;
  name: string;
  name_en: string;
  is_front: boolean;
  image_url_main: string;
  image_url_secondary: string;
}

interface Equipment {
  id: number;
  name: string;
}

interface License {
  id: number;
  full_name: string;
  short_name: string;
  url: string;
}

interface Exercise {
  id: number;
  uuid: string;
  name: string;
  exercise_base: number;
  description: string;
  created: string;
  language: number;
  aliases: any[];
  notes: any[];
  license: number;
  license_title: string;
  license_object_url: string;
  license_author: string;
  license_author_url: string;
  license_derivative_source_url: string;
  author_history: string[];
}

interface Video {
  id: number;
  uuid: string;
  exercise_base: number;
  video: string;
  is_main: boolean;
  size: number;
  duration: string;
  width: number;
  height: number;
  codec: string;
  codec_long: string;
  license: number;
  license_title: string;
  license_object_url: string;
  license_author: string;
  license_author_url: string;
  license_derivative_source_url: string;
  author_history: string[];
}

export type GetFoodsResponse = Food[];

export interface Food {
  fdcId: number;
  description: string;
  dataType: string;
  publicationDate: string;
  foodCode?: string;
  foodNutrients: FoodNutrient[];
  ndbNumber?: string;
}

export interface FoodNutrient {
  number: string;
  name: string;
  amount: number;
  unitName: string;
  derivationCode?: string;
  derivationDescription?: string;
}
