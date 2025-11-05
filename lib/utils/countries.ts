/**
 * Country and subdivision (state/province) data for international shipping
 */

export interface Country {
  code: string; // ISO 3166-1 alpha-2
  name: string;
  subdivisionLabel: string; // "State", "Province", "Region", etc.
  subdivisions: Subdivision[];
  postalCodeLabel: string; // "ZIP Code", "Postal Code", etc.
  postalCodePattern?: string; // Regex pattern for validation
}

export interface Subdivision {
  code: string;
  name: string;
}

/**
 * US States
 */
const US_STATES: Subdivision[] = [
  { code: 'AL', name: 'Alabama' },
  { code: 'AK', name: 'Alaska' },
  { code: 'AZ', name: 'Arizona' },
  { code: 'AR', name: 'Arkansas' },
  { code: 'CA', name: 'California' },
  { code: 'CO', name: 'Colorado' },
  { code: 'CT', name: 'Connecticut' },
  { code: 'DE', name: 'Delaware' },
  { code: 'FL', name: 'Florida' },
  { code: 'GA', name: 'Georgia' },
  { code: 'HI', name: 'Hawaii' },
  { code: 'ID', name: 'Idaho' },
  { code: 'IL', name: 'Illinois' },
  { code: 'IN', name: 'Indiana' },
  { code: 'IA', name: 'Iowa' },
  { code: 'KS', name: 'Kansas' },
  { code: 'KY', name: 'Kentucky' },
  { code: 'LA', name: 'Louisiana' },
  { code: 'ME', name: 'Maine' },
  { code: 'MD', name: 'Maryland' },
  { code: 'MA', name: 'Massachusetts' },
  { code: 'MI', name: 'Michigan' },
  { code: 'MN', name: 'Minnesota' },
  { code: 'MS', name: 'Mississippi' },
  { code: 'MO', name: 'Missouri' },
  { code: 'MT', name: 'Montana' },
  { code: 'NE', name: 'Nebraska' },
  { code: 'NV', name: 'Nevada' },
  { code: 'NH', name: 'New Hampshire' },
  { code: 'NJ', name: 'New Jersey' },
  { code: 'NM', name: 'New Mexico' },
  { code: 'NY', name: 'New York' },
  { code: 'NC', name: 'North Carolina' },
  { code: 'ND', name: 'North Dakota' },
  { code: 'OH', name: 'Ohio' },
  { code: 'OK', name: 'Oklahoma' },
  { code: 'OR', name: 'Oregon' },
  { code: 'PA', name: 'Pennsylvania' },
  { code: 'RI', name: 'Rhode Island' },
  { code: 'SC', name: 'South Carolina' },
  { code: 'SD', name: 'South Dakota' },
  { code: 'TN', name: 'Tennessee' },
  { code: 'TX', name: 'Texas' },
  { code: 'UT', name: 'Utah' },
  { code: 'VT', name: 'Vermont' },
  { code: 'VA', name: 'Virginia' },
  { code: 'WA', name: 'Washington' },
  { code: 'WV', name: 'West Virginia' },
  { code: 'WI', name: 'Wisconsin' },
  { code: 'WY', name: 'Wyoming' },
];

/**
 * Canadian Provinces and Territories
 */
const CANADIAN_PROVINCES: Subdivision[] = [
  { code: 'AB', name: 'Alberta' },
  { code: 'BC', name: 'British Columbia' },
  { code: 'MB', name: 'Manitoba' },
  { code: 'NB', name: 'New Brunswick' },
  { code: 'NL', name: 'Newfoundland and Labrador' },
  { code: 'NT', name: 'Northwest Territories' },
  { code: 'NS', name: 'Nova Scotia' },
  { code: 'NU', name: 'Nunavut' },
  { code: 'ON', name: 'Ontario' },
  { code: 'PE', name: 'Prince Edward Island' },
  { code: 'QC', name: 'Quebec' },
  { code: 'SK', name: 'Saskatchewan' },
  { code: 'YT', name: 'Yukon' },
];

/**
 * Supported countries with their subdivisions
 * Sorted alphabetically for easy dropdown usage
 */
export const COUNTRIES: Country[] = [
  {
    code: 'AU',
    name: 'Australia',
    subdivisionLabel: 'State/Territory',
    subdivisions: [
      { code: 'ACT', name: 'Australian Capital Territory' },
      { code: 'NSW', name: 'New South Wales' },
      { code: 'NT', name: 'Northern Territory' },
      { code: 'QLD', name: 'Queensland' },
      { code: 'SA', name: 'South Australia' },
      { code: 'TAS', name: 'Tasmania' },
      { code: 'VIC', name: 'Victoria' },
      { code: 'WA', name: 'Western Australia' },
    ],
    postalCodeLabel: 'Postcode',
    postalCodePattern: '^\\d{4}$',
  },
  {
    code: 'CA',
    name: 'Canada',
    subdivisionLabel: 'Province/Territory',
    subdivisions: CANADIAN_PROVINCES,
    postalCodeLabel: 'Postal Code',
    postalCodePattern: '^[A-Za-z]\\d[A-Za-z][ -]?\\d[A-Za-z]\\d$',
  },
  {
    code: 'FR',
    name: 'France',
    subdivisionLabel: 'Region',
    subdivisions: [],
    postalCodeLabel: 'Postal Code',
    postalCodePattern: '^\\d{5}$',
  },
  {
    code: 'DE',
    name: 'Germany',
    subdivisionLabel: 'State',
    subdivisions: [],
    postalCodeLabel: 'Postal Code',
    postalCodePattern: '^\\d{5}$',
  },
  {
    code: 'IT',
    name: 'Italy',
    subdivisionLabel: 'Province',
    subdivisions: [],
    postalCodeLabel: 'Postal Code',
    postalCodePattern: '^\\d{5}$',
  },
  {
    code: 'JP',
    name: 'Japan',
    subdivisionLabel: 'Prefecture',
    subdivisions: [],
    postalCodeLabel: 'Postal Code',
    postalCodePattern: '^\\d{3}-?\\d{4}$',
  },
  {
    code: 'MX',
    name: 'Mexico',
    subdivisionLabel: 'State',
    subdivisions: [],
    postalCodeLabel: 'Postal Code',
    postalCodePattern: '^\\d{5}$',
  },
  {
    code: 'NL',
    name: 'Netherlands',
    subdivisionLabel: 'Province',
    subdivisions: [],
    postalCodeLabel: 'Postcode',
    postalCodePattern: '^\\d{4}[ ]?[A-Z]{2}$',
  },
  {
    code: 'NZ',
    name: 'New Zealand',
    subdivisionLabel: 'Region',
    subdivisions: [],
    postalCodeLabel: 'Postcode',
    postalCodePattern: '^\\d{4}$',
  },
  {
    code: 'ES',
    name: 'Spain',
    subdivisionLabel: 'Province',
    subdivisions: [],
    postalCodeLabel: 'Postal Code',
    postalCodePattern: '^\\d{5}$',
  },
  {
    code: 'SE',
    name: 'Sweden',
    subdivisionLabel: 'County',
    subdivisions: [],
    postalCodeLabel: 'Postal Code',
    postalCodePattern: '^\\d{3}[ ]?\\d{2}$',
  },
  {
    code: 'CH',
    name: 'Switzerland',
    subdivisionLabel: 'Canton',
    subdivisions: [],
    postalCodeLabel: 'Postal Code',
    postalCodePattern: '^\\d{4}$',
  },
  {
    code: 'GB',
    name: 'United Kingdom',
    subdivisionLabel: 'County',
    subdivisions: [],
    postalCodeLabel: 'Postcode',
    postalCodePattern: '^[A-Z]{1,2}\\d[A-Z\\d]?[ ]?\\d[A-Z]{2}$',
  },
  {
    code: 'US',
    name: 'United States',
    subdivisionLabel: 'State',
    subdivisions: US_STATES,
    postalCodeLabel: 'ZIP Code',
    postalCodePattern: '^\\d{5}(-\\d{4})?$',
  },
];

/**
 * Helper function to get country by code
 */
export function getCountryByCode(code: string): Country | undefined {
  return COUNTRIES.find((c) => c.code === code);
}

/**
 * Helper function to get all countries sorted by name
 */
export function getAllCountries(): Country[] {
  return COUNTRIES.sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Helper function to check if a country has subdivisions
 */
export function hasSubdivisions(countryCode: string): boolean {
  const country = getCountryByCode(countryCode);
  return country ? country.subdivisions.length > 0 : false;
}
