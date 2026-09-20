import React, { useState } from 'react';
import { Plus, Trash2, Sparkles, Palette, Layers, Box, Wrench, Sliders, UploadCloud, Loader2 } from 'lucide-react';
import { Button } from '../common/Button';
import { uploadFileToStorage } from '../../lib/storage';

export interface OptionValueDraft {
  id: string;
  label: string;
  colorHex?: string;
}

export interface OptionDraft {
  id: string; // 'color' | 'size' | 'finish' | 'material' | 'model' | custom
  name: string;
  type: 'color' | 'button' | 'select' | 'radio';
  values: OptionValueDraft[];
  required: boolean;
}

export interface VariantDraft {
  id?: string;
  sku: string;
  price: number;
  stock: number;
  image_url?: string;
  attributes: Record<string, string>;
  active: boolean;
}

interface ProductVariantEditorProps {
  hasVariants: boolean;
  onHasVariantsChange: (hasVariants: boolean) => void;
  options: OptionDraft[];
  onOptionsChange: (options: OptionDraft[]) => void;
  variants: VariantDraft[];
  onVariantsChange: (variants: VariantDraft[]) => void;
  basePrice: number;
  baseStock: number;
  baseSku: string;
  baseImageUrl: string;
}

const PRESET_COLORS = [
  { label: 'Matte Black', hex: '#18181b' },
  { label: 'Brushed Gold', hex: '#d4af37' },
  { label: 'Polished Chrome', hex: '#cbd5e1' },
  { label: 'Alpine White', hex: '#ffffff' },
  { label: 'Brushed Nickel', hex: '#94a3b8' },
  { label: 'Rose Gold', hex: '#b76e79' },
  { label: 'Emerald Sage', hex: '#065f46' },
  { label: 'Gunmetal Grey', hex: '#374151' },
];

export const ProductVariantEditor: React.FC<ProductVariantEditorProps> = ({
  hasVariants,
  onHasVariantsChange,
  options,
  onOptionsChange,
  variants,
  onVariantsChange,
  basePrice,
  baseStock,
  baseSku,
  baseImageUrl,
}) => {
  // Dimension enable toggles
  const isColorEnabled = options.some((o) => o.id === 'color');
  const isSizeEnabled = options.some((o) => o.id === 'size');
  const isFinishEnabled = options.some((o) => o.id === 'finish');
  const isMaterialEnabled = options.some((o) => o.id === 'material');
  const isModelEnabled = options.some((o) => o.id === 'model');

  // Input states for adding values
  const [newColorName, setNewColorName] = useState('');
  const [newColorHex, setNewColorHex] = useState('#18181b');
  const [newSizeName, setNewSizeName] = useState('');
  const [newFinishName, setNewFinishName] = useState('');
  const [newMaterialName, setNewMaterialName] = useState('');
  const [newModelName, setNewModelName] = useState('');
  const [uploadingVariantIdx, setUploadingVariantIdx] = useState<number | null>(null);

  // Upload variant image to Supabase storage bucket
  const handleVariantFileUpload = async (idx: number, file: File) => {
    setUploadingVariantIdx(idx);
    try {
      const res = await uploadFileToStorage(file, { bucket: 'product-images', folder: 'products/variants' });
      if (res.url) {
        updateVariant(idx, { image_url: res.url });
      }
    } catch (err) {
      console.error('Variant image upload failed:', err);
    } finally {
      setUploadingVariantIdx(null);
    }
  };

  // Toggle option dimension
  const toggleDimension = (id: string, name: string, type: 'color' | 'button' | 'select') => {
    const exists = options.some((o) => o.id === id);
    if (exists) {
      onOptionsChange(options.filter((o) => o.id !== id));
    } else {
      onOptionsChange([...options, { id, name, type, values: [], required: true }]);
    }
  };

  // Add value to an option
  const addValueToOption = (optionId: string, valueLabel: string, colorHex?: string) => {
    const trimmed = valueLabel.trim();
    if (!trimmed) return;

    onOptionsChange(
      options.map((opt) => {
        if (opt.id !== optionId) return opt;
        if (opt.values.some((v) => v.label.toLowerCase() === trimmed.toLowerCase())) return opt;
        const valId = trimmed.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
        return {
          ...opt,
          values: [...opt.values, { id: valId, label: trimmed, colorHex }],
        };
      })
    );
  };

  // Remove value from an option
  const removeValueFromOption = (optionId: string, valueId: string) => {
    onOptionsChange(
      options.map((opt) => {
        if (opt.id !== optionId) return opt;
        return {
          ...opt,
          values: opt.values.filter((v) => v.id !== valueId),
        };
      })
    );
  };

  // Generate Cartesian combinations
  const handleGenerateCombinations = () => {
    const activeOptions = options.filter((o) => o.values.length > 0);
    if (activeOptions.length === 0) {
      alert('Please add at least one option value before generating combinations.');
      return;
    }

    let combinations: Record<string, string>[] = [{}];

    for (const option of activeOptions) {
      const nextCombos: Record<string, string>[] = [];
      for (const combo of combinations) {
        for (const val of option.values) {
          nextCombos.push({
            ...combo,
            [option.id]: val.label,
          });
        }
      }
      combinations = nextCombos;
    }

    const generatedVariants: VariantDraft[] = combinations.map((attrs) => {
      // Check if existing variant has this exact combination
      const existing = variants.find((v) =>
        Object.entries(attrs).every(([k, val]) => v.attributes[k] === val)
      );
      if (existing) return existing;

      // Auto-generate a clean SKU
      const attrCodes = Object.values(attrs)
        .map((v) => v.substring(0, 3).toUpperCase().replace(/[^A-Z0-9]/g, ''))
        .filter(Boolean);
      const suffix = attrCodes.join('-');
      const generatedSku = baseSku ? `${baseSku}-${suffix}` : `EBC-${suffix}`;

      return {
        sku: generatedSku,
        price: basePrice > 0 ? basePrice : 0,
        stock: baseStock > 0 ? baseStock : 10,
        image_url: baseImageUrl || '',
        attributes: attrs,
        active: true,
      };
    });

    onVariantsChange(generatedVariants);
  };

  // Update a specific variant field
  const updateVariant = (index: number, updates: Partial<VariantDraft>) => {
    const copy = [...variants];
    copy[index] = { ...copy[index], ...updates };
    onVariantsChange(copy);
  };

  // Delete a specific variant
  const deleteVariant = (index: number) => {
    onVariantsChange(variants.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-6 pt-4 border-t border-gray-200">
      {/* Master Variant Switch */}
      <div className="flex items-center justify-between p-4 bg-emerald-50/70 border border-emerald-200 rounded-xl">
        <div className="space-y-0.5">
          <h4 className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
            <Sliders className="h-4 w-4 text-primary" />
            Enable Multi-Attribute Variants
          </h4>
          <p className="text-xs text-gray-600">
            Control whether this product has configurable options (Colors, Sizes, Finishes, Materials, Models).
          </p>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={hasVariants}
            onChange={(e) => onHasVariantsChange(e.target.checked)}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
        </label>
      </div>

      {hasVariants && (
        <div className="space-y-6 bg-gray-50/70 p-5 rounded-2xl border border-gray-200">
          <div className="border-b border-gray-200 pb-3">
            <h4 className="text-sm font-bold text-gray-900">Admin Variant Options Configuration</h4>
            <p className="text-xs text-gray-500">
              Enable only the option dimensions that apply to this product. Enabled options will appear on the product page.
            </p>
          </div>

          {/* Dimension 1: Colors */}
          <div className="p-4 bg-white rounded-xl border border-gray-200 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Palette className="h-4 w-4 text-secondary" />
                <span className="text-xs font-bold uppercase tracking-wider text-gray-700">
                  Has Multiple Colors?
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => toggleDimension('color', 'Color', 'color')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                    isColorEnabled
                      ? 'bg-primary text-white shadow-sm'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {isColorEnabled ? 'YES' : 'NO'}
                </button>
              </div>
            </div>

            {isColorEnabled && (
              <div className="pt-3 border-t border-gray-100 space-y-3">
                {/* Preset quick colors */}
                <div>
                  <span className="text-[11px] font-semibold text-gray-500 block mb-1.5">
                    Quick-Add Sanitaryware Colors:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {PRESET_COLORS.map((preset) => (
                      <button
                        key={preset.label}
                        type="button"
                        onClick={() => addValueToOption('color', preset.label, preset.hex)}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium bg-gray-100 hover:bg-gray-200 text-gray-800 transition-colors"
                      >
                        <span
                          className="w-3 h-3 rounded-full border border-black/20"
                          style={{ backgroundColor: preset.hex }}
                        />
                        <span>{preset.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Custom Color Input */}
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="color"
                    value={newColorHex}
                    onChange={(e) => setNewColorHex(e.target.value)}
                    className="w-8 h-8 rounded border border-gray-300 cursor-pointer p-0.5"
                    title="Choose color hex"
                  />
                  <input
                    type="text"
                    placeholder="Custom color name (e.g. Brushed Bronze)"
                    value={newColorName}
                    onChange={(e) => setNewColorName(e.target.value)}
                    className="flex-grow px-3 py-1.5 rounded-lg text-xs border border-gray-300 focus:outline-none focus:border-primary"
                  />
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => {
                      addValueToOption('color', newColorName, newColorHex);
                      setNewColorName('');
                    }}
                  >
                    <Plus className="h-3.5 w-3.5 mr-1" /> Add
                  </Button>
                </div>

                {/* Active Color Chips */}
                <div className="flex flex-wrap gap-2 pt-1">
                  {options
                    .find((o) => o.id === 'color')
                    ?.values.map((v) => (
                      <span
                        key={v.id}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-xs font-semibold text-gray-900"
                      >
                        <span
                          className="w-3.5 h-3.5 rounded-full border border-black/20"
                          style={{ backgroundColor: v.colorHex || '#18181b' }}
                        />
                        {v.label}
                        <button
                          type="button"
                          onClick={() => removeValueFromOption('color', v.id)}
                          className="text-gray-400 hover:text-danger ml-1"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                </div>
              </div>
            )}
          </div>

          {/* Dimension 2: Finishes */}
          <div className="p-4 bg-white rounded-xl border border-gray-200 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-secondary" />
                <span className="text-xs font-bold uppercase tracking-wider text-gray-700">
                  Has Multiple Finishes?
                </span>
              </div>
              <button
                type="button"
                onClick={() => toggleDimension('finish', 'Surface Finish', 'button')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  isFinishEnabled
                    ? 'bg-primary text-white shadow-sm'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {isFinishEnabled ? 'YES' : 'NO'}
              </button>
            </div>

            {isFinishEnabled && (
              <div className="pt-3 border-t border-gray-100 space-y-3">
                <div className="flex flex-wrap gap-1.5">
                  {['Matte', 'Brushed', 'Mirror Gloss', 'PVD Satin', 'Textured'].map((fn) => (
                    <button
                      key={fn}
                      type="button"
                      onClick={() => addValueToOption('finish', fn)}
                      className="px-2.5 py-1 rounded-md text-[11px] font-medium bg-gray-100 hover:bg-gray-200 text-gray-800"
                    >
                      + {fn}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Custom finish name (e.g. Satin Polish)"
                    value={newFinishName}
                    onChange={(e) => setNewFinishName(e.target.value)}
                    className="flex-grow px-3 py-1.5 rounded-lg text-xs border border-gray-300 focus:outline-none focus:border-primary"
                  />
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => {
                      addValueToOption('finish', newFinishName);
                      setNewFinishName('');
                    }}
                  >
                    <Plus className="h-3.5 w-3.5 mr-1" /> Add
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {options
                    .find((o) => o.id === 'finish')
                    ?.values.map((v) => (
                      <span
                        key={v.id}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-xs font-semibold text-gray-900"
                      >
                        {v.label}
                        <button
                          type="button"
                          onClick={() => removeValueFromOption('finish', v.id)}
                          className="text-gray-400 hover:text-danger ml-1"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                </div>
              </div>
            )}
          </div>

          {/* Dimension 3: Sizes */}
          <div className="p-4 bg-white rounded-xl border border-gray-200 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers className="h-4 w-4 text-secondary" />
                <span className="text-xs font-bold uppercase tracking-wider text-gray-700">
                  Has Multiple Sizes / Dimensions?
                </span>
              </div>
              <button
                type="button"
                onClick={() => toggleDimension('size', 'Size', 'button')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  isSizeEnabled
                    ? 'bg-primary text-white shadow-sm'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {isSizeEnabled ? 'YES' : 'NO'}
              </button>
            </div>

            {isSizeEnabled && (
              <div className="pt-3 border-t border-gray-100 space-y-3">
                <div className="flex flex-wrap gap-1.5">
                  {['10-Inch', '12-Inch', '1500mm', '1700mm', '600mm', '900mm', '1200mm'].map((sz) => (
                    <button
                      key={sz}
                      type="button"
                      onClick={() => addValueToOption('size', sz)}
                      className="px-2.5 py-1 rounded-md text-[11px] font-medium bg-gray-100 hover:bg-gray-200 text-gray-800"
                    >
                      + {sz}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Custom size (e.g. 500 x 400 mm)"
                    value={newSizeName}
                    onChange={(e) => setNewSizeName(e.target.value)}
                    className="flex-grow px-3 py-1.5 rounded-lg text-xs border border-gray-300 focus:outline-none focus:border-primary"
                  />
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => {
                      addValueToOption('size', newSizeName);
                      setNewSizeName('');
                    }}
                  >
                    <Plus className="h-3.5 w-3.5 mr-1" /> Add
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {options
                    .find((o) => o.id === 'size')
                    ?.values.map((v) => (
                      <span
                        key={v.id}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-xs font-semibold text-gray-900"
                      >
                        {v.label}
                        <button
                          type="button"
                          onClick={() => removeValueFromOption('size', v.id)}
                          className="text-gray-400 hover:text-danger ml-1"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                </div>
              </div>
            )}
          </div>

          {/* Dimension 4: Materials */}
          <div className="p-4 bg-white rounded-xl border border-gray-200 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Box className="h-4 w-4 text-secondary" />
                <span className="text-xs font-bold uppercase tracking-wider text-gray-700">
                  Has Multiple Materials?
                </span>
              </div>
              <button
                type="button"
                onClick={() => toggleDimension('material', 'Material', 'button')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  isMaterialEnabled
                    ? 'bg-primary text-white shadow-sm'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {isMaterialEnabled ? 'YES' : 'NO'}
              </button>
            </div>

            {isMaterialEnabled && (
              <div className="pt-3 border-t border-gray-100 space-y-3">
                <div className="flex flex-wrap gap-1.5">
                  {['Solid Brass', 'SUS304 Stainless Steel', 'Vitreous China Ceramic', 'Reinforced Acrylic'].map((mat) => (
                    <button
                      key={mat}
                      type="button"
                      onClick={() => addValueToOption('material', mat)}
                      className="px-2.5 py-1 rounded-md text-[11px] font-medium bg-gray-100 hover:bg-gray-200 text-gray-800"
                    >
                      + {mat}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Custom material name"
                    value={newMaterialName}
                    onChange={(e) => setNewMaterialName(e.target.value)}
                    className="flex-grow px-3 py-1.5 rounded-lg text-xs border border-gray-300 focus:outline-none focus:border-primary"
                  />
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => {
                      addValueToOption('material', newMaterialName);
                      setNewMaterialName('');
                    }}
                  >
                    <Plus className="h-3.5 w-3.5 mr-1" /> Add
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {options
                    .find((o) => o.id === 'material')
                    ?.values.map((v) => (
                      <span
                        key={v.id}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-xs font-semibold text-gray-900"
                      >
                        {v.label}
                        <button
                          type="button"
                          onClick={() => removeValueFromOption('material', v.id)}
                          className="text-gray-400 hover:text-danger ml-1"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                </div>
              </div>
            )}
          </div>

          {/* Dimension 5: Models / Configurations */}
          <div className="p-4 bg-white rounded-xl border border-gray-200 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Wrench className="h-4 w-4 text-secondary" />
                <span className="text-xs font-bold uppercase tracking-wider text-gray-700">
                  Has Multiple Models / Configurations?
                </span>
              </div>
              <button
                type="button"
                onClick={() => toggleDimension('model', 'Model', 'button')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  isModelEnabled
                    ? 'bg-primary text-white shadow-sm'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {isModelEnabled ? 'YES' : 'NO'}
              </button>
            </div>

            {isModelEnabled && (
              <div className="pt-3 border-t border-gray-100 space-y-3">
                <div className="flex flex-wrap gap-1.5">
                  {['Single Lever', 'Concealed Mixer', 'Wall Mounted', 'Countertop'].map((mdl) => (
                    <button
                      key={mdl}
                      type="button"
                      onClick={() => addValueToOption('model', mdl)}
                      className="px-2.5 py-1 rounded-md text-[11px] font-medium bg-gray-100 hover:bg-gray-200 text-gray-800"
                    >
                      + {mdl}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Custom model configuration"
                    value={newModelName}
                    onChange={(e) => setNewModelName(e.target.value)}
                    className="flex-grow px-3 py-1.5 rounded-lg text-xs border border-gray-300 focus:outline-none focus:border-primary"
                  />
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => {
                      addValueToOption('model', newModelName);
                      setNewModelName('');
                    }}
                  >
                    <Plus className="h-3.5 w-3.5 mr-1" /> Add
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {options
                    .find((o) => o.id === 'model')
                    ?.values.map((v) => (
                      <span
                        key={v.id}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-xs font-semibold text-gray-900"
                      >
                        {v.label}
                        <button
                          type="button"
                          onClick={() => removeValueFromOption('model', v.id)}
                          className="text-gray-400 hover:text-danger ml-1"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                </div>
              </div>
            )}
          </div>

          {/* Combinations Matrix Generator */}
          <div className="space-y-4 pt-4 border-t border-gray-200">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <h5 className="text-sm font-bold text-gray-900">Variant Combinations & Inventory Matrix</h5>
                <p className="text-xs text-gray-500">
                  Configure specific SKU, price, stock, and images for each valid combination.
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleGenerateCombinations}
                >
                  <Sparkles className="h-3.5 w-3.5 mr-1 text-primary" /> Generate Combinations
                </Button>
                {variants.length > 0 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => onVariantsChange([])}
                  >
                    Clear
                  </Button>
                )}
              </div>
            </div>

            {variants.length === 0 ? (
              <div className="p-6 text-center border-2 border-dashed border-gray-200 rounded-xl bg-white text-gray-500 text-xs space-y-2">
                <p className="font-semibold">No variant combinations generated yet.</p>
                <p>Enable options above, then click "Generate Combinations".</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                {variants.map((variant, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 bg-white rounded-xl border border-gray-200 shadow-sm space-y-3 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex flex-wrap items-center gap-1.5">
                        {Object.entries(variant.attributes).map(([attrKey, attrVal]) => (
                          <span
                            key={attrKey}
                            className="px-2 py-0.5 rounded bg-primary/10 text-primary font-bold text-[10px]"
                          >
                            {attrKey.toUpperCase()}: {attrVal}
                          </span>
                        ))}
                      </div>
                      <div className="flex items-center gap-3">
                        <label className="flex items-center gap-1.5 cursor-pointer text-gray-600 font-medium">
                          <input
                            type="checkbox"
                            checked={variant.active}
                            onChange={(e) => updateVariant(idx, { active: e.target.checked })}
                            className="rounded border-gray-300 accent-primary h-3.5 w-3.5"
                          />
                          <span>Active</span>
                        </label>
                        <button
                          type="button"
                          onClick={() => deleteVariant(idx)}
                          className="text-gray-400 hover:text-danger"
                          title="Delete variant combination"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
                      <div>
                        <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
                          Variant SKU
                        </label>
                        <input
                          type="text"
                          value={variant.sku}
                          onChange={(e) => updateVariant(idx, { sku: e.target.value })}
                          placeholder="SKU"
                          className="w-full px-2.5 py-1.5 rounded-lg border border-gray-300 font-mono text-xs focus:outline-none focus:border-primary"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
                          Price (₹)
                        </label>
                        <input
                          type="number"
                          value={variant.price}
                          onChange={(e) => updateVariant(idx, { price: Number(e.target.value) })}
                          className="w-full px-2.5 py-1.5 rounded-lg border border-gray-300 font-semibold text-xs focus:outline-none focus:border-primary"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
                          Stock
                        </label>
                        <input
                          type="number"
                          value={variant.stock}
                          onChange={(e) => updateVariant(idx, { stock: Number(e.target.value) })}
                          className="w-full px-2.5 py-1.5 rounded-lg border border-gray-300 font-semibold text-xs focus:outline-none focus:border-primary"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1 flex items-center justify-between">
                          <span>Variant Image</span>
                          {uploadingVariantIdx === idx && (
                            <span className="text-primary flex items-center gap-1 font-semibold normal-case">
                              <Loader2 className="h-3 w-3 animate-spin" /> Uploading...
                            </span>
                          )}
                        </label>
                        {variant.image_url ? (
                          <div className="flex items-center gap-2 p-1.5 bg-gray-50 border border-gray-200 rounded-lg">
                            <img
                              src={variant.image_url}
                              alt="Variant preview"
                              className="h-7 w-7 rounded object-cover border border-gray-200 shrink-0"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = 'https://placehold.co/40x40?text=Img';
                              }}
                            />
                            <label className="text-[11px] text-primary hover:underline cursor-pointer font-semibold shrink-0">
                              Change
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                disabled={uploadingVariantIdx === idx}
                                onChange={(e) => {
                                  if (e.target.files?.[0]) {
                                    handleVariantFileUpload(idx, e.target.files[0]);
                                    e.target.value = '';
                                  }
                                }}
                              />
                            </label>
                            <span className="text-gray-300">•</span>
                            <button
                              type="button"
                              onClick={() => updateVariant(idx, { image_url: '' })}
                              className="text-[11px] text-danger hover:underline font-semibold shrink-0"
                              title="Remove variant image"
                            >
                              Remove
                            </button>
                          </div>
                        ) : (
                          <label className="flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-lg border border-dashed border-gray-300 hover:border-primary hover:bg-primary/5 cursor-pointer text-[11px] font-semibold text-gray-700 transition-colors">
                            <UploadCloud className="h-3.5 w-3.5 text-primary" />
                            <span>Upload Image</span>
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              disabled={uploadingVariantIdx === idx}
                              onChange={(e) => {
                                if (e.target.files?.[0]) {
                                  handleVariantFileUpload(idx, e.target.files[0]);
                                  e.target.value = '';
                                }
                              }}
                            />
                          </label>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
