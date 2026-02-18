'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  DICE_LADDER,
  DAMAGE_TYPE_META,
  STAT_RULES,
  SPECIAL_MODES,
  MATERIALS,
  computeFinalDice,
  Handedness,
  DamageMode,
  ModeCode,
  DamageTypeCode,
  MaterialCode,
  WeaponTemplateWithDetails,
  DamageTypeConfig,
} from '@/types/weapons';

interface WeaponBuilderProps {
  onSave?: (config: {
    name: string;
    weaponTemplateId?: string;
    handedness: Handedness;
    damageMode: DamageMode;
    modeCode: ModeCode;
    material: MaterialCode;
    damageTypes: DamageTypeConfig[];
  }) => void;
  isLoading?: boolean;
}

const MATERIAL_ORDER: MaterialCode[] = ['steel', 'silver', 'gold', 'truesteel', 'crystal', 'obsidian', 'heartwood'];

const DAMAGE_TYPE_ORDER: DamageTypeCode[] = ['S', 'B', 'P'];

export default function WeaponBuilder({ onSave, isLoading }: WeaponBuilderProps) {
  // State
  const [weaponName, setWeaponName] = useState('');
  const [templates, setTemplates] = useState<WeaponTemplateWithDetails[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [handedness, setHandedness] = useState<Handedness>('1H');
  const [damageMode, setDamageMode] = useState<DamageMode>('single');
  const [modeCode, setModeCode] = useState<ModeCode>('none');
  const [singleType, setSingleType] = useState<DamageTypeCode>('S');
  const [dualPrimary, setDualPrimary] = useState<DamageTypeCode>('S');
  const [dualSecondary, setDualSecondary] = useState<DamageTypeCode>('B');
  const [statReqs, setStatReqs] = useState<Record<DamageTypeCode, number | null>>({
    S: null,
    B: null,
    P: null,
  });
  const [material, setMaterial] = useState<MaterialCode>('steel');

  // Fetch templates on mount
  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const response = await fetch('/api/weapon-templates');
        if (response.ok) {
          const data = await response.json();
          setTemplates(data);
        }
      } catch (error) {
        console.error('Failed to fetch weapon templates:', error);
      }
    };
    fetchTemplates();
  }, []);

  // Get selected damage types based on mode
  const selectedTypes: DamageTypeCode[] = useMemo(() => {
    if (damageMode === 'single') {
      return [singleType];
    } else {
      // Dual: ensure distinct types
      if (dualPrimary === dualSecondary) {
        return [dualPrimary];
      }
      return [dualPrimary, dualSecondary];
    }
  }, [damageMode, singleType, dualPrimary, dualSecondary]);

  // Handle template selection
  const handleTemplateChange = useCallback((templateId: string) => {
    if (!templateId) {
      setSelectedTemplateId(null);
      return;
    }

    const template = templates.find(t => t.id === templateId);
    if (!template) return;

    setSelectedTemplateId(templateId);
    setHandedness(template.handedness);
    setDamageMode(template.damageMode);
    setModeCode(template.modeCode);

    // Set damage types from template
    if (template.damageTypes.length >= 1) {
      const firstType = template.damageTypes[0].damageTypeCode as DamageTypeCode;
      setSingleType(firstType);
      setDualPrimary(firstType);

      // Set suggested stat threshold
      setStatReqs(prev => ({
        ...prev,
        [firstType]: template.damageTypes[0].suggestedStatThreshold ?? null,
      }));
    }

    if (template.damageTypes.length >= 2 && template.damageMode === 'dual') {
      const secondType = template.damageTypes[1].damageTypeCode as DamageTypeCode;
      setDualSecondary(secondType);

      setStatReqs(prev => ({
        ...prev,
        [secondType]: template.damageTypes[1].suggestedStatThreshold ?? null,
      }));
    }
  }, [templates]);

  // Handle damage mode change
  const handleDamageModeChange = useCallback((mode: DamageMode) => {
    setDamageMode(mode);
    if (mode === 'dual') {
      // When switching to dual, ensure secondary is different from primary
      if (dualPrimary === dualSecondary) {
        const newSecondary = DAMAGE_TYPE_ORDER.find(t => t !== dualPrimary) || 'B';
        setDualSecondary(newSecondary);
      }
    }
  }, [dualPrimary, dualSecondary]);

  // Handle dual type changes to keep them distinct
  const handleDualPrimaryChange = useCallback((type: DamageTypeCode) => {
    setDualPrimary(type);
    if (type === dualSecondary) {
      const newSecondary = DAMAGE_TYPE_ORDER.find(t => t !== type) || 'B';
      setDualSecondary(newSecondary);
    }
  }, [dualSecondary]);

  const handleDualSecondaryChange = useCallback((type: DamageTypeCode) => {
    setDualSecondary(type);
    if (type === dualPrimary) {
      const newPrimary = DAMAGE_TYPE_ORDER.find(t => t !== type) || 'S';
      setDualPrimary(newPrimary);
    }
  }, [dualPrimary]);

  // Handle stat requirement change
  const handleStatReqChange = useCallback((type: DamageTypeCode, threshold: number | null) => {
    setStatReqs(prev => ({ ...prev, [type]: threshold }));
  }, []);

  // Reset stat requirements when handedness changes (thresholds differ)
  useEffect(() => {
    // Validate current thresholds are still valid for new handedness
    const validThresholds = new Set(
      Object.values(STAT_RULES[handedness])
        .flatMap(rules => rules.map(r => r.threshold))
    );

    setStatReqs(prev => {
      const updated: Record<DamageTypeCode, number | null> = { ...prev };
      for (const type of DAMAGE_TYPE_ORDER) {
        if (prev[type] !== null && !validThresholds.has(prev[type])) {
          updated[type] = null;
        }
      }
      return updated;
    });
  }, [handedness]);

  // Compute final dice for display
  const finalDice = useMemo(() => {
    return computeFinalDice({
      handedness,
      damageMode,
      modeCode,
      damageTypes: selectedTypes.map((code) => ({
        code,
        statThreshold: statReqs[code],
      })),
      material,
    });
  }, [handedness, damageMode, modeCode, selectedTypes, statReqs, material]);

  // Build damage type configs for save
  const buildDamageTypeConfigs = useCallback((): DamageTypeConfig[] => {
    return selectedTypes.map((code, idx) => ({
      code,
      statThreshold: statReqs[code],
      displayOrder: idx,
    }));
  }, [selectedTypes, statReqs]);

  // Handle save
  const handleSave = useCallback(() => {
    if (!onSave) return;
    if (!weaponName.trim()) {
      alert('Please enter a weapon name');
      return;
    }

    onSave({
      name: weaponName.trim(),
      weaponTemplateId: selectedTemplateId || undefined,
      handedness,
      damageMode,
      modeCode,
      material,
      damageTypes: buildDamageTypeConfigs(),
    });
  }, [onSave, weaponName, selectedTemplateId, handedness, damageMode, modeCode, material, buildDamageTypeConfigs]);

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 shadow-lg">
      <h2 className="text-2xl font-bold text-white mb-6">⚔️ Weapon Builder</h2>

      {/* Template Selection */}
      {templates.length > 0 && (
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Start from Template (optional)
          </label>
          <select
            value={selectedTemplateId || ''}
            onChange={(e) => handleTemplateChange(e.target.value)}
            className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          >
            <option value="">Custom Weapon</option>
            {templates.map(template => (
              <option key={template.id} value={template.id}>
                {template.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Controls Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Handedness */}
        <fieldset className="border border-gray-600 rounded-lg p-4">
          <legend className="px-2 text-sm text-gray-400">Handedness</legend>
          <div className="flex gap-3">
            {(['1H', '2H'] as Handedness[]).map(h => (
              <label
                key={h}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg border cursor-pointer transition-all ${
                  handedness === h
                    ? 'bg-indigo-500/20 border-indigo-500 text-white'
                    : 'bg-gray-900 border-gray-600 text-gray-300 hover:border-gray-500'
                }`}
              >
                <input
                  type="radio"
                  name="handedness"
                  value={h}
                  checked={handedness === h}
                  onChange={() => setHandedness(h)}
                  className="accent-indigo-500"
                />
                <span>{h === '1H' ? '1-Handed' : '2-Handed'}</span>
              </label>
            ))}
          </div>
        </fieldset>

        {/* Damage Type Count */}
        <fieldset className="border border-gray-600 rounded-lg p-4">
          <legend className="px-2 text-sm text-gray-400">Damage Type Count</legend>
          <div className="flex gap-3">
            {(['single', 'dual'] as DamageMode[]).map(mode => (
              <label
                key={mode}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg border cursor-pointer transition-all ${
                  damageMode === mode
                    ? 'bg-indigo-500/20 border-indigo-500 text-white'
                    : 'bg-gray-900 border-gray-600 text-gray-300 hover:border-gray-500'
                }`}
              >
                <input
                  type="radio"
                  name="damageMode"
                  value={mode}
                  checked={damageMode === mode}
                  onChange={() => handleDamageModeChange(mode)}
                  className="accent-indigo-500"
                />
                <span className="capitalize">{mode}</span>
              </label>
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Dual damage types apply a <strong className="text-gray-300">−1 step</strong> penalty to the base.
          </p>
        </fieldset>

        {/* Damage Type Selection */}
        <fieldset className="border border-gray-600 rounded-lg p-4 md:col-span-2">
          <legend className="px-2 text-sm text-gray-400">Damage Type(s)</legend>
          
          {damageMode === 'single' ? (
            <div className="flex flex-col gap-2">
              <label className="text-sm text-gray-300">Type</label>
              <select
                value={singleType}
                onChange={(e) => setSingleType(e.target.value as DamageTypeCode)}
                className="w-full md:w-64 px-3 py-2 bg-gray-900 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-indigo-500"
              >
                {DAMAGE_TYPE_ORDER.map(code => (
                  <option key={code} value={code}>
                    {DAMAGE_TYPE_META[code].name}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-sm text-gray-300">Primary Type</label>
                <select
                  value={dualPrimary}
                  onChange={(e) => handleDualPrimaryChange(e.target.value as DamageTypeCode)}
                  className="w-full md:w-64 px-3 py-2 bg-gray-900 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-indigo-500"
                >
                  {DAMAGE_TYPE_ORDER.map(code => (
                    <option key={code} value={code} disabled={code === dualSecondary}>
                      {DAMAGE_TYPE_META[code].name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm text-gray-300">Secondary Type</label>
                <select
                  value={dualSecondary}
                  onChange={(e) => handleDualSecondaryChange(e.target.value as DamageTypeCode)}
                  className="w-full md:w-64 px-3 py-2 bg-gray-900 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-indigo-500"
                >
                  {DAMAGE_TYPE_ORDER.map(code => (
                    <option key={code} value={code} disabled={code === dualPrimary}>
                      {DAMAGE_TYPE_META[code].name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
          <p className="text-xs text-gray-500 mt-2">
            Pick 1 type (Single) or 2 distinct types (Dual).
          </p>
        </fieldset>

        {/* Special Mode */}
        <fieldset className="border border-gray-600 rounded-lg p-4">
          <legend className="px-2 text-sm text-gray-400">Special Mode</legend>
          <select
            value={modeCode}
            onChange={(e) => setModeCode(e.target.value as ModeCode)}
            className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-indigo-500"
          >
            {Object.entries(SPECIAL_MODES).map(([code, mode]) => (
              <option key={code} value={code}>
                {mode.name}{mode.stepPenalty ? ` (${mode.stepPenalty} step)` : ''}
              </option>
            ))}
          </select>
          <p className="text-xs text-gray-500 mt-2">
            Special mode subtracts its penalty from <strong className="text-gray-300">all</strong> damage types.
          </p>
        </fieldset>

        {/* Material Type */}
        <fieldset className="border border-gray-600 rounded-lg p-4">
          <legend className="px-2 text-sm text-gray-400">Material</legend>
          <select
            value={material}
            onChange={(e) => setMaterial(e.target.value as MaterialCode)}
            className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-indigo-500"
          >
            {MATERIAL_ORDER.map((code) => {
              const mat = MATERIALS[code];
              return (
                <option key={code} value={code}>
                  {mat.name}
                </option>
              );
            })}
          </select>
          {/* Show effect description if material has special properties */}
          {(MATERIALS[material].dieBonusType || MATERIALS[material].requirementReductionType) && (
            <p className={`text-xs mt-2 ${MATERIALS[material].colorClass}`}>
              ✦ {MATERIALS[material].description}
            </p>
          )}
          <p className="text-xs text-gray-500 mt-1">
            Some materials grant bonuses to specific damage types.
          </p>
        </fieldset>

        {/* Stat Requirements */}
        <fieldset className="border border-gray-600 rounded-lg p-4 md:col-span-2">
          <legend className="px-2 text-sm text-gray-400">Stat Requirements (per selected type)</legend>
          <div className="flex flex-wrap gap-4">
            {selectedTypes.map(code => {
              const meta = DAMAGE_TYPE_META[code];
              const rules = STAT_RULES[handedness][code];
              
              return (
                <div
                  key={code}
                  className="flex-1 min-w-[260px] border border-gray-700 rounded-lg p-3 bg-gray-900"
                >
                  <div className="mb-3 font-medium text-white">
                    <span
                      className="inline-block w-2 h-2 rounded-full mr-2"
                      style={{ backgroundColor: meta.dotColor }}
                    />
                    {meta.name} requirement
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {rules.map((rule, idx) => (
                      <label
                        key={idx}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-all text-sm ${
                          statReqs[code] === rule.threshold
                            ? 'bg-indigo-500/20 border-indigo-500 text-white'
                            : 'bg-gray-800 border-gray-600 text-gray-300 hover:border-gray-500'
                        }`}
                      >
                        <input
                          type="radio"
                          name={`req-${code}`}
                          checked={statReqs[code] === rule.threshold}
                          onChange={() => handleStatReqChange(code, rule.threshold)}
                          className="accent-indigo-500"
                        />
                        <span>{rule.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
          <p className="text-xs text-gray-500 mt-3">
            Higher thresholds increase die size for that type only.
          </p>
        </fieldset>
      </div>

      {/* Dice Ladder Visualization */}
      <div className="mt-6">
        <h3 className="text-lg font-semibold text-white mb-4">Damage Dice Ladder</h3>
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-4">
          {/* Ladder Steps */}
          <div className="grid grid-cols-8 gap-2 bg-gradient-to-r from-gray-900 to-gray-800 border border-gray-700 rounded-xl p-3">
            {DICE_LADDER.map((die, stepIdx) => {
              // Find which damage types land on this step
              const typesOnStep = selectedTypes.filter(code => {
                const result = finalDice[code];
                return result && result.step === stepIdx;
              });

              const isActive = typesOnStep.length > 0;

              return (
                <div
                  key={stepIdx}
                  className={`relative flex flex-col items-center justify-start p-2 pb-10 rounded-lg border transition-all min-h-[80px] ${
                    isActive
                      ? 'border-indigo-500 bg-indigo-500/10 shadow-[0_0_8px_rgba(99,102,241,0.2)]'
                      : 'border-gray-700 border-dashed bg-gray-900/50'
                  }`}
                >
                  <span className={`font-semibold tabular-nums ${isActive ? 'text-white' : 'text-gray-500'}`}>
                    {die}
                  </span>

                  {/* Type chips */}
                  <div className="absolute bottom-2 left-1 right-1 flex flex-col gap-1">
                    {typesOnStep.map(code => {
                      const meta = DAMAGE_TYPE_META[code];
                      return (
                        <div
                          key={code}
                          className={`flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] leading-none border ${meta.bgClass} ${meta.borderClass}`}
                        >
                          <span
                            className="w-1.5 h-1.5 rounded-full"
                            style={{ backgroundColor: meta.dotColor }}
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Readout Panel */}
          <div className="flex flex-col gap-2">
            {/* Mode Readout */}
            <div className="flex items-center justify-between px-3 py-2 bg-gray-900 border border-gray-700 rounded-full">
              <span className="text-xs text-gray-400">Special Mode</span>
              <span className="text-sm text-white">
                {SPECIAL_MODES[modeCode].name}
                {SPECIAL_MODES[modeCode].stepPenalty ? ` (${SPECIAL_MODES[modeCode].stepPenalty} step)` : ''}
              </span>
            </div>

            {/* Damage Type Results */}
            {selectedTypes.map(code => {
              const meta = DAMAGE_TYPE_META[code];
              const result = finalDice[code];
              const threshold = statReqs[code];

              return (
                <div
                  key={code}
                  className="flex items-center justify-between px-3 py-2 bg-gray-900 border border-gray-700 rounded-full"
                >
                  <span className="flex items-center gap-2 text-xs text-gray-400">
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: meta.dotColor }}
                    />
                    <span>
                      {meta.name}
                      {threshold ? ` (${meta.stat} ${threshold})` : ''}
                    </span>
                  </span>
                  <span className="text-sm font-semibold text-white">
                    {result?.die || '—'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Save Section (only if onSave is provided) */}
      {onSave && (
        <div className="mt-8 pt-6 border-t border-gray-700">
          <div className="flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Weapon Name
              </label>
              <input
                type="text"
                value={weaponName}
                onChange={(e) => setWeaponName(e.target.value)}
                placeholder="Enter weapon name..."
                className="w-full px-4 py-2 bg-gray-900 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
            <button
              onClick={handleSave}
              disabled={isLoading || !weaponName.trim()}
              className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                isLoading || !weaponName.trim()
                  ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                  : 'bg-indigo-600 hover:bg-indigo-700 text-white'
              }`}
            >
              {isLoading ? 'Saving...' : 'Save Weapon'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
