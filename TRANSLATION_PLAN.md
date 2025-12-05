# Translation Implementation Plan - Romanian Language Support

## Overview
This document outlines the plan to add Romanian (ro) language support to the Production Management frontend application using `react-i18next`.

## Technology Stack
- **Library**: `react-i18next` + `i18next`
- **Language Detection**: `i18next-browser-languagedetector`
- **Backend**: `i18next-http-backend` (optional, for loading translations from server)

## Implementation Steps

### Phase 1: Setup and Installation

1. **Install Dependencies**
   ```bash
   npm install i18next react-i18next i18next-browser-languagedetector
   ```

2. **Create Translation File Structure**
   ```
   src/
     locales/
       en/
         common.json       # Common UI elements (buttons, labels, etc.)
         navigation.json   # Sidebar, menu items
         orders.json       # Orders module translations
         acquisitions.json # Acquisitions module translations
         inventory.json    # Inventory module translations
         production.json   # Production module translations
         clients.json      # Clients module translations
         suppliers.json    # Suppliers module translations
         transports.json   # Transports module translations
         users.json        # User management translations
         errors.json       # Error messages
         validation.json   # Validation messages
       ro/
         (same structure as en/)
   ```

3. **Create i18n Configuration**
   - File: `src/i18n/config.ts`
   - Configure language detection
   - Set up fallback language (English)
   - Configure namespace loading

### Phase 2: Core Implementation

4. **Initialize i18n in App**
   - Import i18n config in `main.tsx` or `App.tsx`
   - Wrap app with i18n provider (not needed for react-i18next v13+)

5. **Create Language Switcher Component**
   - File: `src/components/LanguageSwitcher.tsx`
   - Dropdown/button to switch between English and Romanian
   - Store preference in localStorage
   - Display current language flag/name

6. **Create Translation Hook/Utility**
   - Custom hook for easier access: `src/hooks/useTranslation.ts`
   - Or use built-in `useTranslation` from react-i18next

### Phase 3: Translation Files Creation

7. **Create English Translation Files** (baseline)
   - Start with common.json (buttons, labels, placeholders)
   - Navigation items
   - Error messages
   - Validation messages

8. **Create Romanian Translation Files**
   - Translate all English strings to Romanian
   - Maintain same structure and keys

### Phase 4: Component Migration

9. **Migrate Components Gradually** (Priority Order)
   - **High Priority**:
     - Sidebar.tsx (navigation)
     - Login.tsx
     - Common buttons and labels
     - Error messages
   
   - **Medium Priority**:
     - Dashboard.tsx
     - Orders.tsx and related components
     - Acquisitions.tsx and related components
   
   - **Low Priority**:
     - Inventory, Production, Clients, Suppliers, Transports, Users

10. **Translation Pattern**
    ```tsx
    // Before
    <button>Create Order</button>
    
    // After
    import { useTranslation } from 'react-i18next';
    const { t } = useTranslation('orders');
    <button>{t('createOrder')}</button>
    ```

### Phase 5: Advanced Features

11. **Pluralization Support**
    - Handle singular/plural forms
    - Example: "1 item" vs "2 items"

12. **Date/Number Formatting**
    - Use i18next formatting for dates
    - Format currency based on locale

13. **Dynamic Content Translation**
    - Status labels
    - Enum values (OrderStatus, AcquisitionStatus, etc.)

## File Structure After Implementation

```
src/
  i18n/
    config.ts              # i18n configuration
    resources.ts            # Translation resources (optional)
  locales/
    en/
      common.json
      navigation.json
      orders.json
      acquisitions.json
      inventory.json
      production.json
      clients.json
      suppliers.json
      transports.json
      users.json
      errors.json
      validation.json
    ro/
      (same files as en/)
  components/
    LanguageSwitcher.tsx    # Language selection component
  hooks/
    useTranslation.ts       # Custom translation hook (optional)
```

## Translation Key Naming Convention

- Use camelCase for keys
- Group by feature/module
- Be descriptive: `orders.createOrder` not `create`
- Use namespaces to organize: `orders:createOrder`

## Example Translation Files

### `locales/en/common.json`
```json
{
  "buttons": {
    "create": "Create",
    "edit": "Edit",
    "delete": "Delete",
    "save": "Save",
    "cancel": "Cancel",
    "close": "Close",
    "submit": "Submit"
  },
  "labels": {
    "name": "Name",
    "email": "Email",
    "phone": "Phone",
    "address": "Address"
  }
}
```

### `locales/ro/common.json`
```json
{
  "buttons": {
    "create": "Creează",
    "edit": "Editează",
    "delete": "Șterge",
    "save": "Salvează",
    "cancel": "Anulează",
    "close": "Închide",
    "submit": "Trimite"
  },
  "labels": {
    "name": "Nume",
    "email": "Email",
    "phone": "Telefon",
    "address": "Adresă"
  }
}
```

## Implementation Checklist

- [ ] Install dependencies
- [ ] Create i18n configuration
- [ ] Create translation file structure
- [ ] Create LanguageSwitcher component
- [ ] Initialize i18n in App
- [ ] Create English translation files (common, navigation)
- [ ] Create Romanian translation files (common, navigation)
- [ ] Migrate Sidebar component
- [ ] Migrate Login component
- [ ] Migrate common buttons/labels
- [ ] Migrate Orders module
- [ ] Migrate Acquisitions module
- [ ] Migrate remaining modules
- [ ] Test language switching
- [ ] Test persistence of language preference
- [ ] Review and refine translations

## Testing Strategy

1. **Language Switching**: Verify smooth transition between languages
2. **Persistence**: Check that language preference is saved
3. **Fallback**: Ensure English is used when Romanian translation is missing
4. **Dynamic Content**: Test status labels, dates, numbers
5. **All Modules**: Verify all pages work in both languages

## Future Enhancements

- Add more languages (if needed)
- Load translations from backend API
- Support for RTL languages (if needed)
- Context-aware translations
- Translation management UI (for non-developers)

