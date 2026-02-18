import { db } from '@/db/client';
import {
  weaponTemplates,
  weaponTemplateDamageTypes,
  weapons,
  weaponDamageTypes,
  userWeapons,
} from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import {
  CreateWeaponFormData,
  WeaponTemplateWithDetails,
  WeaponWithDetails,
  DAMAGE_TYPE_META,
  SPECIAL_MODES,
  MATERIALS,
  computeSingleFinalDie,
  DamageTypeCode,
  MaterialCode,
} from '@/types/weapons';

/**
 * Get all weapon templates with their damage types
 */
export async function getAllWeaponTemplates(): Promise<
  WeaponTemplateWithDetails[]
> {
  try {
    const database = db();

    // Get all templates
    const templates = await database.select().from(weaponTemplates);

    // Get all damage types for templates
    const allDamageTypes = await database
      .select()
      .from(weaponTemplateDamageTypes);

    // Group damage types by template
    const damageTypesByTemplate = new Map<
      string,
      (typeof allDamageTypes)[number][]
    >();
    for (const dt of allDamageTypes) {
      const existing = damageTypesByTemplate.get(dt.weaponTemplateId) || [];
      existing.push(dt);
      damageTypesByTemplate.set(dt.weaponTemplateId, existing);
    }

    // Combine templates with their damage types
    return templates.map((template) => {
      const templateDamageTypes = damageTypesByTemplate.get(template.id) || [];
      return {
        ...template,
        damageTypes: templateDamageTypes
          .sort((a, b) => a.displayOrder - b.displayOrder)
          .map((dt) => ({
            ...dt,
            meta: DAMAGE_TYPE_META[dt.damageTypeCode as DamageTypeCode],
          })),
      };
    });
  } catch (error) {
    console.error('Error fetching weapon templates:', error);
    return [];
  }
}

/**
 * Get a single weapon template by ID with damage types
 */
export async function getWeaponTemplateById(
  id: string
): Promise<WeaponTemplateWithDetails | null> {
  try {
    const database = db();

    const [template] = await database
      .select()
      .from(weaponTemplates)
      .where(eq(weaponTemplates.id, id));

    if (!template) return null;

    const damageTypes = await database
      .select()
      .from(weaponTemplateDamageTypes)
      .where(eq(weaponTemplateDamageTypes.weaponTemplateId, id));

    return {
      ...template,
      damageTypes: damageTypes
        .sort((a, b) => a.displayOrder - b.displayOrder)
        .map((dt) => ({
          ...dt,
          meta: DAMAGE_TYPE_META[dt.damageTypeCode as DamageTypeCode],
        })),
    };
  } catch (error) {
    console.error('Error fetching weapon template:', error);
    return null;
  }
}

/**
 * Create a new weapon instance for a user
 */
export async function createWeapon(
  formData: CreateWeaponFormData,
  userId: string,
  createdBy: string
) {
  try {
    const database = db();

    // Create the weapon
    const [newWeapon] = await database
      .insert(weapons)
      .values({
        name: formData.name,
        weaponTemplateId: formData.weaponTemplateId || null,
        handedness: formData.handedness,
        damageMode: formData.damageMode,
        modeCode: formData.modeCode,
        material: formData.material,
        createdBy,
        createdAt: new Date(),
      })
      .returning();

    // Create damage type entries
    for (const dt of formData.damageTypes) {
      await database.insert(weaponDamageTypes).values({
        weaponId: newWeapon.id,
        damageTypeCode: dt.code,
        statThreshold: dt.statThreshold,
        displayOrder: dt.displayOrder,
      });
    }

    // Create user-weapon ownership
    await database.insert(userWeapons).values({
      weaponId: newWeapon.id,
      userId,
    });

    return newWeapon;
  } catch (error) {
    console.error('Error creating weapon:', error);
    throw new Error('Failed to create weapon');
  }
}

/**
 * Get all weapons for a user with computed details
 */
export async function getUserWeapons(
  userId: string
): Promise<WeaponWithDetails[]> {
  try {
    const database = db();

    // Get all weapons for the user
    const userWeaponRows = await database
      .select({
        weaponId: userWeapons.weaponId,
        weapon: weapons,
      })
      .from(userWeapons)
      .innerJoin(weapons, eq(userWeapons.weaponId, weapons.id))
      .where(eq(userWeapons.userId, userId));

    if (userWeaponRows.length === 0) return [];

    // Get weapon IDs
    const weaponIds = userWeaponRows.map((row) => row.weaponId);

    // Get all damage types for these weapons
    const allDamageTypes = await database.select().from(weaponDamageTypes);
    const relevantDamageTypes = allDamageTypes.filter((dt) =>
      weaponIds.includes(dt.weaponId)
    );

    // Group damage types by weapon
    const damageTypesByWeapon = new Map<
      string,
      (typeof relevantDamageTypes)[number][]
    >();
    for (const dt of relevantDamageTypes) {
      const existing = damageTypesByWeapon.get(dt.weaponId) || [];
      existing.push(dt);
      damageTypesByWeapon.set(dt.weaponId, existing);
    }

    // Get template names for weapons that have templates
    const templateIds = userWeaponRows
      .map((row) => row.weapon.weaponTemplateId)
      .filter((id): id is string => id !== null);

    const templateNameMap = new Map<string, string>();
    if (templateIds.length > 0) {
      const templates = await database.select().from(weaponTemplates);
      for (const t of templates) {
        if (templateIds.includes(t.id)) {
          templateNameMap.set(t.id, t.name);
        }
      }
    }

    // Build result with computed dice
    return userWeaponRows.map((row) => {
      const weapon = row.weapon;
      const weaponDamageTypesForWeapon =
        damageTypesByWeapon.get(weapon.id) || [];

      const damageTypesWithDetails = weaponDamageTypesForWeapon
        .sort((a, b) => a.displayOrder - b.displayOrder)
        .map((dt) => {
          const code = dt.damageTypeCode as DamageTypeCode;
          const meta = DAMAGE_TYPE_META[code];

          // Compute final die (include material bonus)
          const { die: finalDie, step } = computeSingleFinalDie({
            handedness: weapon.handedness,
            damageMode: weapon.damageMode,
            modeCode: weapon.modeCode,
            damageTypeCode: code,
            statThreshold: dt.statThreshold,
            material: weapon.material as MaterialCode,
          });

          // Get stat bonus (step difference from base)
          const statBonus = step;

          return {
            ...dt,
            meta,
            finalDie,
            statBonus,
          };
        });

      return {
        ...weapon,
        damageTypes: damageTypesWithDetails,
        modeMeta: SPECIAL_MODES[weapon.modeCode],
        materialMeta: MATERIALS[weapon.material as MaterialCode],
        templateName: weapon.weaponTemplateId
          ? templateNameMap.get(weapon.weaponTemplateId)
          : undefined,
      };
    });
  } catch (error) {
    console.error('Error fetching user weapons:', error);
    return [];
  }
}

/**
 * Delete a weapon (with ownership check)
 */
export async function deleteWeapon(
  weaponId: string,
  userId: string
): Promise<boolean> {
  try {
    const database = db();

    // Check ownership
    const [ownership] = await database
      .select()
      .from(userWeapons)
      .where(
        and(eq(userWeapons.weaponId, weaponId), eq(userWeapons.userId, userId))
      );

    if (!ownership) {
      throw new Error('Weapon not found or not owned by user');
    }

    // Delete the weapon (cascades to damage types and user_weapons)
    await database.delete(weapons).where(eq(weapons.id, weaponId));

    return true;
  } catch (error) {
    console.error('Error deleting weapon:', error);
    throw error;
  }
}
