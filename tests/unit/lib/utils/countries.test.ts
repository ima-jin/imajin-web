import { describe, it, expect } from 'vitest';
import { getCountryByCode, getAllCountries, hasSubdivisions, COUNTRIES } from '@/lib/utils/countries';

describe('countries utility', () => {
  describe('COUNTRIES data', () => {
    it('includes United States with states', () => {
      const us = COUNTRIES.find(c => c.code === 'US');
      expect(us).toBeDefined();
      expect(us?.name).toBe('United States');
      expect(us?.subdivisions.length).toBeGreaterThan(0);
      expect(us?.subdivisionLabel).toBe('State');
      expect(us?.postalCodeLabel).toBe('ZIP Code');
    });

    it('includes Canada with provinces', () => {
      const ca = COUNTRIES.find(c => c.code === 'CA');
      expect(ca).toBeDefined();
      expect(ca?.name).toBe('Canada');
      expect(ca?.subdivisions.length).toBe(13); // 10 provinces + 3 territories
      expect(ca?.subdivisionLabel).toBe('Province/Territory');
      expect(ca?.postalCodeLabel).toBe('Postal Code');
    });

    it('includes common international countries', () => {
      const countryCodes = COUNTRIES.map(c => c.code);
      expect(countryCodes).toContain('GB'); // United Kingdom
      expect(countryCodes).toContain('AU'); // Australia
      expect(countryCodes).toContain('DE'); // Germany
      expect(countryCodes).toContain('FR'); // France
      expect(countryCodes).toContain('JP'); // Japan
    });

    it('all countries have required fields', () => {
      COUNTRIES.forEach(country => {
        expect(country.code).toBeTruthy();
        expect(country.code.length).toBe(2);
        expect(country.name).toBeTruthy();
        expect(country.subdivisionLabel).toBeTruthy();
        expect(country.postalCodeLabel).toBeTruthy();
        expect(Array.isArray(country.subdivisions)).toBe(true);
      });
    });

    it('US has all 50 states', () => {
      const us = COUNTRIES.find(c => c.code === 'US');
      expect(us?.subdivisions.length).toBe(50);

      // Check a few specific states
      const california = us?.subdivisions.find(s => s.code === 'CA');
      expect(california?.name).toBe('California');

      const newYork = us?.subdivisions.find(s => s.code === 'NY');
      expect(newYork?.name).toBe('New York');
    });

    it('Canada has all provinces and territories', () => {
      const ca = COUNTRIES.find(c => c.code === 'CA');

      // Check specific provinces
      const ontario = ca?.subdivisions.find(s => s.code === 'ON');
      expect(ontario?.name).toBe('Ontario');

      const quebec = ca?.subdivisions.find(s => s.code === 'QC');
      expect(quebec?.name).toBe('Quebec');

      const britishColumbia = ca?.subdivisions.find(s => s.code === 'BC');
      expect(britishColumbia?.name).toBe('British Columbia');
    });
  });

  describe('getCountryByCode', () => {
    it('returns country for valid code', () => {
      const us = getCountryByCode('US');
      expect(us).toBeDefined();
      expect(us?.name).toBe('United States');
    });

    it('returns country for Canada', () => {
      const ca = getCountryByCode('CA');
      expect(ca).toBeDefined();
      expect(ca?.name).toBe('Canada');
    });

    it('returns undefined for invalid code', () => {
      const invalid = getCountryByCode('XX');
      expect(invalid).toBeUndefined();
    });

    it('is case-sensitive', () => {
      const lowercase = getCountryByCode('us');
      expect(lowercase).toBeUndefined();
    });
  });

  describe('getAllCountries', () => {
    it('returns all countries', () => {
      const countries = getAllCountries();
      expect(countries.length).toBeGreaterThan(0);
      expect(countries.length).toBe(COUNTRIES.length);
    });

    it('returns countries sorted by name', () => {
      const countries = getAllCountries();
      const names = countries.map(c => c.name);
      const sortedNames = [...names].sort((a, b) => a.localeCompare(b));
      expect(names).toEqual(sortedNames);
    });
  });

  describe('hasSubdivisions', () => {
    it('returns true for countries with subdivisions', () => {
      expect(hasSubdivisions('US')).toBe(true);
      expect(hasSubdivisions('CA')).toBe(true);
      expect(hasSubdivisions('AU')).toBe(true);
    });

    it('returns false for countries without subdivisions', () => {
      expect(hasSubdivisions('FR')).toBe(false);
      expect(hasSubdivisions('DE')).toBe(false);
      expect(hasSubdivisions('IT')).toBe(false);
    });

    it('returns false for invalid country code', () => {
      expect(hasSubdivisions('XX')).toBe(false);
    });
  });

  describe('postal code patterns', () => {
    it('US has ZIP code pattern', () => {
      const us = getCountryByCode('US');
      expect(us?.postalCodePattern).toBeDefined();

      const pattern = new RegExp(us!.postalCodePattern!);
      expect(pattern.test('12345')).toBe(true);
      expect(pattern.test('12345-6789')).toBe(true);
      expect(pattern.test('1234')).toBe(false);
    });

    it('Canada has postal code pattern', () => {
      const ca = getCountryByCode('CA');
      expect(ca?.postalCodePattern).toBeDefined();

      const pattern = new RegExp(ca!.postalCodePattern!);
      expect(pattern.test('K1A 0B1')).toBe(true);
      expect(pattern.test('K1A0B1')).toBe(true);
      expect(pattern.test('K1A-0B1')).toBe(true);
      expect(pattern.test('12345')).toBe(false);
    });

    it('UK has postcode pattern', () => {
      const gb = getCountryByCode('GB');
      expect(gb?.postalCodePattern).toBeDefined();

      const pattern = new RegExp(gb!.postalCodePattern!);
      expect(pattern.test('SW1A 1AA')).toBe(true);
      expect(pattern.test('SW1A1AA')).toBe(true);
      expect(pattern.test('12345')).toBe(false);
    });
  });
});
