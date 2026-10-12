/**
 * Well-known neighbourhoods for the 21 product cities.
 * Centres are approximate. `zoom` is a web-mercator camera level
 * (14 is a neighbourhood, 12 is a large borough).
 */

export type NeighbourhoodPlace = {
  name: string;
  citySlug: string;
  lat: number;
  lng: number;
  zoom: number;
  aliases?: readonly string[];
};

export const NEIGHBOURHOODS: readonly NeighbourhoodPlace[] = [
  { name: 'Downtown', citySlug: 'toronto', lat: 43.651, lng: -79.381, zoom: 14 },
  { name: 'Yorkville', citySlug: 'toronto', lat: 43.6708, lng: -79.3906, zoom: 15 },
  { name: 'Kensington Market', citySlug: 'toronto', lat: 43.6546, lng: -79.4004, zoom: 16 },
  { name: 'Queen West', citySlug: 'toronto', lat: 43.6455, lng: -79.4075, zoom: 15 },
  { name: 'Distillery District', citySlug: 'toronto', lat: 43.6503, lng: -79.3596, zoom: 16 },
  { name: 'Leslieville', citySlug: 'toronto', lat: 43.664, lng: -79.331, zoom: 14 },
  { name: 'The Annex', citySlug: 'toronto', lat: 43.669, lng: -79.406, zoom: 15 },
  { name: 'Liberty Village', citySlug: 'toronto', lat: 43.638, lng: -79.42, zoom: 15 },
  { name: 'North York', citySlug: 'toronto', lat: 43.7615, lng: -79.4111, zoom: 12 },
  { name: 'Scarborough', citySlug: 'toronto', lat: 43.7764, lng: -79.2318, zoom: 12 },
  { name: 'Etobicoke', citySlug: 'toronto', lat: 43.6205, lng: -79.5132, zoom: 12 },

  { name: 'Downtown', citySlug: 'montreal', lat: 45.502, lng: -73.57, zoom: 14 },
  {
    name: 'Vieux-Montréal',
    citySlug: 'montreal',
    lat: 45.505,
    lng: -73.555,
    zoom: 15,
    aliases: ['Old Montreal', 'Old Montréal'],
  },
  {
    name: 'Plateau-Mont-Royal',
    citySlug: 'montreal',
    lat: 45.523,
    lng: -73.58,
    zoom: 14,
    aliases: ['The Plateau', 'Plateau'],
  },
  { name: 'Mile End', citySlug: 'montreal', lat: 45.523, lng: -73.6, zoom: 15 },
  { name: 'Griffintown', citySlug: 'montreal', lat: 45.492, lng: -73.561, zoom: 15 },
  { name: 'Outremont', citySlug: 'montreal', lat: 45.518, lng: -73.608, zoom: 14 },
  { name: 'Hochelaga', citySlug: 'montreal', lat: 45.542, lng: -73.545, zoom: 14 },
  { name: 'Notre-Dame-de-Grâce', citySlug: 'montreal', lat: 45.476, lng: -73.615, zoom: 14, aliases: ['NDG'] },
  { name: 'Little Italy', citySlug: 'montreal', lat: 45.533, lng: -73.612, zoom: 15 },

  { name: 'Downtown', citySlug: 'vancouver', lat: 49.283, lng: -123.121, zoom: 14 },
  { name: 'Gastown', citySlug: 'vancouver', lat: 49.284, lng: -123.108, zoom: 16 },
  { name: 'Yaletown', citySlug: 'vancouver', lat: 49.275, lng: -123.121, zoom: 15 },
  { name: 'Kitsilano', citySlug: 'vancouver', lat: 49.268, lng: -123.168, zoom: 14 },
  { name: 'Commercial Drive', citySlug: 'vancouver', lat: 49.273, lng: -123.069, zoom: 14 },
  { name: 'Granville Island', citySlug: 'vancouver', lat: 49.271, lng: -123.134, zoom: 16 },
  { name: 'West End', citySlug: 'vancouver', lat: 49.285, lng: -123.135, zoom: 15 },
  { name: 'Mount Pleasant', citySlug: 'vancouver', lat: 49.263, lng: -123.101, zoom: 14 },
  { name: 'Coal Harbour', citySlug: 'vancouver', lat: 49.29, lng: -123.124, zoom: 15 },

  { name: 'Downtown', citySlug: 'ottawa', lat: 45.4215, lng: -75.6972, zoom: 14 },
  { name: 'ByWard Market', citySlug: 'ottawa', lat: 45.427, lng: -75.692, zoom: 16 },
  { name: 'Glebe', citySlug: 'ottawa', lat: 45.4, lng: -75.691, zoom: 15 },
  { name: 'Westboro', citySlug: 'ottawa', lat: 45.394, lng: -75.752, zoom: 14 },
  { name: 'Hintonburg', citySlug: 'ottawa', lat: 45.403, lng: -75.724, zoom: 15 },
  { name: 'Centretown', citySlug: 'ottawa', lat: 45.415, lng: -75.695, zoom: 15 },
  { name: 'Sandy Hill', citySlug: 'ottawa', lat: 45.426, lng: -75.679, zoom: 15 },
  { name: 'Kanata', citySlug: 'ottawa', lat: 45.308, lng: -75.898, zoom: 13 },
  { name: 'Orleans', citySlug: 'ottawa', lat: 45.476, lng: -75.514, zoom: 13 },

  { name: 'Downtown', citySlug: 'calgary', lat: 51.046, lng: -114.071, zoom: 14 },
  { name: 'Kensington', citySlug: 'calgary', lat: 51.053, lng: -114.088, zoom: 15 },
  { name: 'Inglewood', citySlug: 'calgary', lat: 51.038, lng: -114.031, zoom: 15 },
  { name: 'Beltline', citySlug: 'calgary', lat: 51.04, lng: -114.071, zoom: 15 },
  { name: 'Mission', citySlug: 'calgary', lat: 51.031, lng: -114.072, zoom: 15 },
  { name: 'Bridgeland', citySlug: 'calgary', lat: 51.056, lng: -114.045, zoom: 15 },
  { name: 'Eau Claire', citySlug: 'calgary', lat: 51.052, lng: -114.07, zoom: 16 },

  { name: 'Downtown', citySlug: 'edmonton', lat: 53.546, lng: -113.494, zoom: 14 },
  {
    name: 'Old Strathcona',
    citySlug: 'edmonton',
    lat: 53.518,
    lng: -113.499,
    zoom: 15,
    aliases: ['Whyte Avenue'],
  },
  { name: 'Oliver', citySlug: 'edmonton', lat: 53.542, lng: -113.522, zoom: 15 },
  { name: '124 Street', citySlug: 'edmonton', lat: 53.545, lng: -113.538, zoom: 15 },
  { name: 'Glenora', citySlug: 'edmonton', lat: 53.546, lng: -113.56, zoom: 14 },

  {
    name: 'Vieux-Québec',
    citySlug: 'quebec',
    lat: 46.813,
    lng: -71.208,
    zoom: 15,
    aliases: ['Old Quebec', 'Old Québec'],
  },
  { name: 'Saint-Roch', citySlug: 'quebec', lat: 46.814, lng: -71.225, zoom: 15 },
  { name: 'Saint-Jean-Baptiste', citySlug: 'quebec', lat: 46.808, lng: -71.218, zoom: 16 },
  { name: 'Montcalm', citySlug: 'quebec', lat: 46.802, lng: -71.222, zoom: 15 },
  { name: 'Limoilou', citySlug: 'quebec', lat: 46.826, lng: -71.228, zoom: 14 },
  { name: 'Sainte-Foy', citySlug: 'quebec', lat: 46.782, lng: -71.292, zoom: 13 },

  { name: 'Downtown', citySlug: 'winnipeg', lat: 49.895, lng: -97.138, zoom: 14 },
  { name: 'Exchange District', citySlug: 'winnipeg', lat: 49.9, lng: -97.141, zoom: 16 },
  { name: 'The Forks', citySlug: 'winnipeg', lat: 49.887, lng: -97.131, zoom: 16 },
  { name: 'Osborne Village', citySlug: 'winnipeg', lat: 49.874, lng: -97.147, zoom: 15 },
  { name: 'Wolseley', citySlug: 'winnipeg', lat: 49.883, lng: -97.166, zoom: 15 },
  { name: 'St. Boniface', citySlug: 'winnipeg', lat: 49.89, lng: -97.116, zoom: 14 },

  { name: 'Downtown', citySlug: 'hamilton', lat: 43.256, lng: -79.871, zoom: 14 },
  { name: 'Locke Street', citySlug: 'hamilton', lat: 43.254, lng: -79.905, zoom: 15 },
  { name: 'James Street North', citySlug: 'hamilton', lat: 43.262, lng: -79.867, zoom: 15 },
  { name: 'Westdale', citySlug: 'hamilton', lat: 43.262, lng: -79.905, zoom: 14 },
  { name: 'Concession Street', citySlug: 'hamilton', lat: 43.243, lng: -79.85, zoom: 15 },
  { name: 'Dundas', citySlug: 'hamilton', lat: 43.266, lng: -79.955, zoom: 14 },

  { name: 'Downtown', citySlug: 'kitchener', lat: 43.451, lng: -80.49, zoom: 15 },
  { name: 'Victoria Park', citySlug: 'kitchener', lat: 43.448, lng: -80.493, zoom: 16 },
  { name: 'Belmont Village', citySlug: 'kitchener', lat: 43.445, lng: -80.472, zoom: 16 },
  { name: 'Uptown Waterloo', citySlug: 'kitchener', lat: 43.464, lng: -80.523, zoom: 15 },

  { name: 'Downtown', citySlug: 'london', lat: 42.9849, lng: -81.2453, zoom: 14 },
  { name: 'Old East Village', citySlug: 'london', lat: 42.988, lng: -81.228, zoom: 15 },
  { name: 'Wortley Village', citySlug: 'london', lat: 42.964, lng: -81.248, zoom: 15 },
  { name: 'Masonville', citySlug: 'london', lat: 43.024, lng: -81.278, zoom: 14 },
  { name: 'Byron', citySlug: 'london', lat: 42.958, lng: -81.33, zoom: 14 },

  { name: 'Downtown', citySlug: 'halifax', lat: 44.649, lng: -63.575, zoom: 15 },
  { name: 'North End', citySlug: 'halifax', lat: 44.66, lng: -63.595, zoom: 14 },
  { name: 'South End', citySlug: 'halifax', lat: 44.635, lng: -63.575, zoom: 14 },
  { name: 'Hydrostone', citySlug: 'halifax', lat: 44.665, lng: -63.605, zoom: 16 },
  { name: 'Quinpool', citySlug: 'halifax', lat: 44.644, lng: -63.595, zoom: 15 },
  { name: 'Dartmouth', citySlug: 'halifax', lat: 44.67, lng: -63.57, zoom: 13 },

  { name: 'Downtown', citySlug: 'st-catharines', lat: 43.16, lng: -79.246, zoom: 15 },
  { name: 'Port Dalhousie', citySlug: 'st-catharines', lat: 43.201, lng: -79.267, zoom: 15 },
  { name: 'Merritton', citySlug: 'st-catharines', lat: 43.148, lng: -79.22, zoom: 15 },
  { name: 'Western Hill', citySlug: 'st-catharines', lat: 43.17, lng: -79.27, zoom: 14 },

  { name: 'Downtown', citySlug: 'windsor', lat: 42.317, lng: -83.037, zoom: 15 },
  { name: 'Walkerville', citySlug: 'windsor', lat: 42.321, lng: -83.012, zoom: 15 },
  { name: 'Sandwich', citySlug: 'windsor', lat: 42.299, lng: -83.071, zoom: 15 },
  { name: 'Erie Street', citySlug: 'windsor', lat: 42.305, lng: -83.033, zoom: 15 },
  { name: 'Riverside', citySlug: 'windsor', lat: 42.338, lng: -82.99, zoom: 14 },

  { name: 'Downtown', citySlug: 'oshawa', lat: 43.897, lng: -78.863, zoom: 15 },
  { name: 'North Oshawa', citySlug: 'oshawa', lat: 43.945, lng: -78.86, zoom: 13 },
  { name: 'Lakeview', citySlug: 'oshawa', lat: 43.868, lng: -78.83, zoom: 14 },
  { name: 'Vanier', citySlug: 'oshawa', lat: 43.91, lng: -78.885, zoom: 14 },

  { name: 'Downtown', citySlug: 'victoria', lat: 48.428, lng: -123.365, zoom: 15 },
  { name: 'James Bay', citySlug: 'victoria', lat: 48.416, lng: -123.372, zoom: 15 },
  { name: 'Fernwood', citySlug: 'victoria', lat: 48.431, lng: -123.344, zoom: 15 },
  { name: 'Cook Street Village', citySlug: 'victoria', lat: 48.42, lng: -123.355, zoom: 16 },
  { name: 'Chinatown', citySlug: 'victoria', lat: 48.429, lng: -123.367, zoom: 16 },
  { name: 'Oak Bay', citySlug: 'victoria', lat: 48.426, lng: -123.318, zoom: 14 },

  { name: 'Downtown', citySlug: 'saskatoon', lat: 52.132, lng: -106.67, zoom: 15 },
  { name: 'Broadway', citySlug: 'saskatoon', lat: 52.119, lng: -106.657, zoom: 15 },
  { name: 'Riversdale', citySlug: 'saskatoon', lat: 52.128, lng: -106.681, zoom: 15 },
  { name: 'Nutana', citySlug: 'saskatoon', lat: 52.116, lng: -106.655, zoom: 14 },
  { name: 'City Park', citySlug: 'saskatoon', lat: 52.143, lng: -106.656, zoom: 15 },

  { name: 'Downtown', citySlug: 'regina', lat: 50.448, lng: -104.618, zoom: 15 },
  { name: 'Cathedral', citySlug: 'regina', lat: 50.451, lng: -104.635, zoom: 15, aliases: ['Cathedral Village'] },
  { name: 'Warehouse District', citySlug: 'regina', lat: 50.453, lng: -104.613, zoom: 16 },
  { name: 'Germantown', citySlug: 'regina', lat: 50.456, lng: -104.61, zoom: 16 },
  { name: 'Lakeview', citySlug: 'regina', lat: 50.43, lng: -104.64, zoom: 14 },

  { name: 'Downtown', citySlug: 'sherbrooke', lat: 45.404, lng: -71.893, zoom: 15 },
  { name: 'Vieux-Nord', citySlug: 'sherbrooke', lat: 45.41, lng: -71.888, zoom: 15 },
  { name: 'Mont-Bellevue', citySlug: 'sherbrooke', lat: 45.39, lng: -71.91, zoom: 14 },
  { name: 'Lennoxville', citySlug: 'sherbrooke', lat: 45.367, lng: -71.856, zoom: 14 },
  { name: 'Jacques-Cartier', citySlug: 'sherbrooke', lat: 45.4, lng: -71.87, zoom: 14 },

  { name: 'Downtown', citySlug: 'kelowna', lat: 49.888, lng: -119.496, zoom: 15 },
  { name: 'Pandosy', citySlug: 'kelowna', lat: 49.872, lng: -119.488, zoom: 15, aliases: ['Pandosy Village'] },
  { name: 'Rutland', citySlug: 'kelowna', lat: 49.886, lng: -119.398, zoom: 14 },
  { name: 'Glenmore', citySlug: 'kelowna', lat: 49.91, lng: -119.46, zoom: 14 },
  { name: 'Lower Mission', citySlug: 'kelowna', lat: 49.84, lng: -119.49, zoom: 14 },

  {
    name: 'City Centre',
    citySlug: 'mississauga',
    lat: 43.593,
    lng: -79.642,
    zoom: 15,
    aliases: ['Downtown'],
  },
  { name: 'Port Credit', citySlug: 'mississauga', lat: 43.551, lng: -79.586, zoom: 15 },
  { name: 'Streetsville', citySlug: 'mississauga', lat: 43.589, lng: -79.713, zoom: 15 },
  { name: 'Cooksville', citySlug: 'mississauga', lat: 43.582, lng: -79.615, zoom: 15 },
  { name: 'Clarkson', citySlug: 'mississauga', lat: 43.515, lng: -79.64, zoom: 14 },
  { name: 'Erin Mills', citySlug: 'mississauga', lat: 43.54, lng: -79.715, zoom: 14 },
];
