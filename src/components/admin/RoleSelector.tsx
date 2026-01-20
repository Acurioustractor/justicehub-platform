'use client';

import { useState, useMemo } from 'react';
import {
  ProfileRole,
  RoleCategory,
  ROLE_DISPLAY_NAMES,
  ROLE_CATEGORIES,
  CATEGORY_DISPLAY_NAMES,
  getGroupedRoleOptions,
  getRoleDisplayName,
  isValidRole,
} from '@/types/roles';

interface RoleSelectorProps {
  /** Current selected role value */
  value: string;
  /** Callback when role changes */
  onChange: (role: string) => void;
  /** Allow custom role input (default: false) */
  allowCustom?: boolean;
  /** Filter to only show certain categories */
  filterCategories?: RoleCategory[];
  /** Placeholder text */
  placeholder?: string;
  /** Additional class names for the container */
  className?: string;
  /** Whether the input is disabled */
  disabled?: boolean;
  /** Label for the field (optional) */
  label?: string;
  /** Helper text below the field (optional) */
  helperText?: string;
  /** Required field indicator */
  required?: boolean;
}

/**
 * Shared role selector component for consistent role selection across admin pages.
 *
 * Features:
 * - Grouped dropdown with role categories
 * - Optional custom role input
 * - Type-safe with ProfileRole type
 * - Consistent styling matching JusticeHub design system
 */
export default function RoleSelector({
  value,
  onChange,
  allowCustom = false,
  filterCategories,
  placeholder = 'Select a role...',
  className = '',
  disabled = false,
  label,
  helperText,
  required = false,
}: RoleSelectorProps) {
  const [isCustomMode, setIsCustomMode] = useState(false);
  const [customValue, setCustomValue] = useState('');

  // Get grouped options, filtered if specified
  const groupedOptions = useMemo(() => {
    const options = getGroupedRoleOptions();
    if (!filterCategories || filterCategories.length === 0) {
      return options;
    }
    return options.filter((group) => filterCategories.includes(group.category));
  }, [filterCategories]);

  // Check if the current value is a standard role or custom
  const isStandardRole = isValidRole(value);
  const displayValue = isStandardRole ? value : '';

  // Handle dropdown change
  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newValue = e.target.value;
    if (newValue === '__custom__') {
      setIsCustomMode(true);
      setCustomValue(value || '');
    } else {
      setIsCustomMode(false);
      onChange(newValue);
    }
  };

  // Handle custom input change
  const handleCustomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCustomValue(e.target.value);
    onChange(e.target.value);
  };

  // Handle switching back to dropdown
  const handleBackToDropdown = () => {
    setIsCustomMode(false);
    onChange('');
  };

  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-bold mb-2">
          {label}
          {required && <span className="text-red-600 ml-1">*</span>}
        </label>
      )}

      {isCustomMode ? (
        <div className="flex gap-2">
          <input
            type="text"
            value={customValue}
            onChange={handleCustomChange}
            className="flex-1 px-4 py-3 border-2 border-black focus:outline-none focus:ring-2 focus:ring-blue-600"
            placeholder="Enter custom role..."
            disabled={disabled}
          />
          <button
            type="button"
            onClick={handleBackToDropdown}
            className="px-4 py-3 border-2 border-black bg-gray-100 hover:bg-gray-200 font-medium"
            disabled={disabled}
          >
            Cancel
          </button>
        </div>
      ) : (
        <select
          value={displayValue}
          onChange={handleSelectChange}
          className="w-full px-4 py-3 border-2 border-black focus:outline-none focus:ring-2 focus:ring-blue-600 bg-white"
          disabled={disabled}
        >
          <option value="">{placeholder}</option>

          {groupedOptions.map((group) => (
            <optgroup key={group.category} label={group.label}>
              {group.options.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </optgroup>
          ))}

          {allowCustom && (
            <optgroup label="Other">
              <option value="__custom__">Enter custom role...</option>
            </optgroup>
          )}
        </select>
      )}

      {/* Show current custom value if not a standard role */}
      {!isCustomMode && value && !isStandardRole && (
        <div className="mt-2 text-sm text-amber-700 bg-amber-50 px-3 py-2 border border-amber-200">
          Current: <strong>{value}</strong> (custom role)
          {allowCustom && (
            <button
              type="button"
              onClick={() => {
                setIsCustomMode(true);
                setCustomValue(value);
              }}
              className="ml-2 underline hover:no-underline"
            >
              Edit
            </button>
          )}
        </div>
      )}

      {helperText && <p className="text-sm text-gray-500 mt-1">{helperText}</p>}
    </div>
  );
}

/**
 * Display component for showing a role badge
 */
export function RoleBadge({
  role,
  showCategory = false,
  size = 'default',
}: {
  role: string;
  showCategory?: boolean;
  size?: 'sm' | 'default' | 'lg';
}) {
  const displayName = getRoleDisplayName(role);
  const isStandard = isValidRole(role);

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    default: 'text-sm px-3 py-1',
    lg: 'text-base px-4 py-2',
  };

  // Category-based colors
  const getCategoryColor = (role: string): string => {
    if (!isStandard) return 'bg-gray-100 text-gray-800 border-gray-300';

    const categoryColors: Record<RoleCategory, string> = {
      leadership: 'bg-purple-100 text-purple-800 border-purple-300',
      staff: 'bg-blue-100 text-blue-800 border-blue-300',
      community: 'bg-green-100 text-green-800 border-green-300',
      supporting: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      content: 'bg-cyan-100 text-cyan-800 border-cyan-300',
      testimonial: 'bg-pink-100 text-pink-800 border-pink-300',
    };

    // Use imported ROLE_CATEGORIES
    const category = ROLE_CATEGORIES[role as ProfileRole] as RoleCategory | undefined;
    return category ? categoryColors[category] : 'bg-gray-100 text-gray-800 border-gray-300';
  };

  return (
    <span
      className={`inline-flex items-center font-medium border ${sizeClasses[size]} ${getCategoryColor(role)}`}
    >
      {displayName}
    </span>
  );
}

/**
 * Multi-select version for selecting multiple roles
 */
export function MultiRoleSelector({
  values,
  onChange,
  filterCategories,
  className = '',
  disabled = false,
  label,
  helperText,
}: {
  values: string[];
  onChange: (roles: string[]) => void;
  filterCategories?: RoleCategory[];
  className?: string;
  disabled?: boolean;
  label?: string;
  helperText?: string;
}) {
  const groupedOptions = useMemo(() => {
    const options = getGroupedRoleOptions();
    if (!filterCategories || filterCategories.length === 0) {
      return options;
    }
    return options.filter((group) => filterCategories.includes(group.category));
  }, [filterCategories]);

  const handleToggle = (role: string) => {
    if (values.includes(role)) {
      onChange(values.filter((v) => v !== role));
    } else {
      onChange([...values, role]);
    }
  };

  return (
    <div className={className}>
      {label && <label className="block text-sm font-bold mb-2">{label}</label>}

      <div className="border-2 border-black max-h-60 overflow-y-auto">
        {groupedOptions.map((group) => (
          <div key={group.category}>
            <div className="px-3 py-2 bg-gray-100 font-bold text-sm border-b border-gray-200">
              {group.label}
            </div>
            <div className="divide-y divide-gray-100">
              {group.options.map((option) => (
                <label
                  key={option.value}
                  className={`flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-gray-50 ${
                    disabled ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={values.includes(option.value)}
                    onChange={() => handleToggle(option.value)}
                    disabled={disabled}
                    className="w-4 h-4"
                  />
                  <span>{option.label}</span>
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Selected roles display */}
      {values.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-2">
          {values.map((role) => (
            <RoleBadge key={role} role={role} size="sm" />
          ))}
        </div>
      )}

      {helperText && <p className="text-sm text-gray-500 mt-1">{helperText}</p>}
    </div>
  );
}
