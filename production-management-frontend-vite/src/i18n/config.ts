import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import translation files
import enCommon from '../locales/en/common.json';
import enNavigation from '../locales/en/navigation.json';
import enOrders from '../locales/en/orders.json';
import enAcquisitions from '../locales/en/acquisitions.json';
import enInventory from '../locales/en/inventory.json';
import enProduction from '../locales/en/production.json';
import enClients from '../locales/en/clients.json';
import enSuppliers from '../locales/en/suppliers.json';
import enTransports from '../locales/en/transports.json';
import enUsers from '../locales/en/users.json';
import enLogin from '../locales/en/login.json';
import enErrors from '../locales/en/errors.json';
import enValidation from '../locales/en/validation.json';

import roCommon from '../locales/ro/common.json';
import roNavigation from '../locales/ro/navigation.json';
import roOrders from '../locales/ro/orders.json';
import roAcquisitions from '../locales/ro/acquisitions.json';
import roInventory from '../locales/ro/inventory.json';
import roProduction from '../locales/ro/production.json';
import roClients from '../locales/ro/clients.json';
import roSuppliers from '../locales/ro/suppliers.json';
import roTransports from '../locales/ro/transports.json';
import roUsers from '../locales/ro/users.json';
import roLogin from '../locales/ro/login.json';
import roErrors from '../locales/ro/errors.json';
import roValidation from '../locales/ro/validation.json';

const resources = {
  en: {
    common: enCommon,
    navigation: enNavigation,
    orders: enOrders,
    acquisitions: enAcquisitions,
    inventory: enInventory,
    production: enProduction,
    clients: enClients,
    suppliers: enSuppliers,
    transports: enTransports,
    users: enUsers,
    login: enLogin,
    errors: enErrors,
    validation: enValidation,
  },
  ro: {
    common: roCommon,
    navigation: roNavigation,
    orders: roOrders,
    acquisitions: roAcquisitions,
    inventory: roInventory,
    production: roProduction,
    clients: roClients,
    suppliers: roSuppliers,
    transports: roTransports,
    users: roUsers,
    login: roLogin,
    errors: roErrors,
    validation: roValidation,
  },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'ro',
    lng: 'ro', // Set Romanian as default language
    defaultNS: 'common',
    ns: [
      'common',
      'navigation',
      'orders',
      'acquisitions',
      'inventory',
      'production',
      'clients',
      'suppliers',
      'transports',
      'users',
      'login',
      'errors',
      'validation',
    ],
    interpolation: {
      escapeValue: false, // React already escapes values
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
      lookupLocalStorage: 'i18nextLng',
      // If no language is found in localStorage or navigator, use Romanian
      fallbackLng: 'ro',
    },
  });

export default i18n;

