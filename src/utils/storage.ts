// src/utils/storage.ts

import { Stickman } from "@/types/stickman";

const STORAGE_KEY = 'stickman-animation-data';

/**
 * Saves an array of Stickman objects to local storage.
 * @param stickmen The array of Stickman objects to save.
 */
export const saveStickmen = (stickmen: Stickman[]): void => {
  try {
    const serializedData = JSON.stringify(stickmen);
    localStorage.setItem(STORAGE_KEY, serializedData);
    console.log('Stickmen data saved to local storage.');
  } catch (error) {
    console.error('Error saving stickmen data:', error);
  }
};

/**
 * Loads an array of Stickman objects from local storage.
 * @returns An array of Stickman objects or null if no data is found or an error occurs.
 */
export const loadStickmen = (): Stickman[] | null => {
  try {
    const serializedData = localStorage.getItem(STORAGE_KEY);
    if (serializedData === null) {
      console.log('No stickmen data found in local storage.');
      return null;
    }
    const stickmen: Stickman[] = JSON.parse(serializedData);
    console.log('Stickmen data loaded from local storage.');
    return stickmen;
  } catch (error) {
    console.error('Error loading stickmen data:', error);
    return null;
  }
};