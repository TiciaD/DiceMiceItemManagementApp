import { db } from '@/db/client';
import { characterPotionMastery, characterSpellMastery } from '@/db/schema';
import { eq, and, sql } from 'drizzle-orm';
import { PotencyType } from '@/types/potions';

/**
 * Calculate mastery points based on potion crafting result and character role
 */
export function calculateMasteryPoints(
  potency: PotencyType,
  isGruntWorker: boolean = false
): number {
  switch (potency) {
    case 'critical_success':
      return isGruntWorker ? 1 : 2; // Grunt worker gets 1, supervisor/direct crafter gets 2
    case 'success':
      return 1; // Both grunt worker and supervisor/direct crafter get 1
    case 'success_unknown':
      // This should not happen at consumption time since unknown should be resolved
      return 1; // Default to success level
    case 'fail':
      return 0; // No mastery for failed potions
    default:
      return 0;
  }
}

/**
 * Award mastery points to a character for a specific potion template
 */
export async function awardPotionMastery(
  characterId: string,
  potionTemplateId: string,
  masteryPoints: number
): Promise<void> {
  if (masteryPoints <= 0) {
    return; // No mastery to award
  }

  console.log(
    `Awarding ${masteryPoints} mastery points to character ${characterId} for potion template ${potionTemplateId}`
  );

  const database = db();

  try {
    // Check if the character already has mastery for this potion
    const existingMastery = await database
      .select()
      .from(characterPotionMastery)
      .where(
        and(
          eq(characterPotionMastery.characterId, characterId),
          eq(characterPotionMastery.potionTemplateId, potionTemplateId)
        )
      )
      .limit(1);

    if (existingMastery.length > 0) {
      // Check if already at max mastery level
      const currentLevel = existingMastery[0].masteryLevel;
      if (currentLevel >= 10) {
        // Already at maximum mastery, no need to update
        console.log(
          `Character ${characterId} is already at max mastery (10) for potion template ${potionTemplateId}`
        );
        return;
      }

      // Update existing mastery level (cap at 10)
      const newLevel = Math.min(currentLevel + masteryPoints, 10);
      console.log(
        `Updating mastery for character ${characterId}: ${currentLevel} -> ${newLevel}`
      );

      await database
        .update(characterPotionMastery)
        .set({
          masteryLevel: newLevel,
          lastUpdated: sql`(unixepoch())`,
        })
        .where(
          and(
            eq(characterPotionMastery.characterId, characterId),
            eq(characterPotionMastery.potionTemplateId, potionTemplateId)
          )
        );
    } else {
      // Create new mastery record (cap at 10)
      const newLevel = Math.min(masteryPoints, 10);
      console.log(
        `Creating new mastery record for character ${characterId}: level ${newLevel}`
      );

      await database.insert(characterPotionMastery).values({
        characterId,
        potionTemplateId,
        masteryLevel: newLevel,
        lastUpdated: sql`(unixepoch())`,
      });
    }
  } catch (error) {
    console.error('Error awarding potion mastery:', error);
    throw error;
  }
}

/**
 * Award mastery to all crafting characters involved in making a potion
 */
export async function awardCraftingMastery(
  potionTemplateId: string,
  potency: PotencyType,
  crafterCharacterId: string | null,
  isGruntWork: boolean,
  supervisorCharacterId: string | null
): Promise<void> {
  console.log(
    `Awarding crafting mastery for potion template ${potionTemplateId} with potency ${potency}`
  );
  console.log(
    `Crafter: ${crafterCharacterId}, IsGruntWork: ${isGruntWork}, Supervisor: ${supervisorCharacterId}`
  );

  try {
    // Award mastery to the primary crafter (either direct crafter or grunt worker)
    if (crafterCharacterId) {
      const masteryPoints = calculateMasteryPoints(potency, isGruntWork);
      console.log(
        `Awarding ${masteryPoints} points to ${
          isGruntWork ? 'grunt worker' : 'crafter'
        } ${crafterCharacterId}`
      );
      await awardPotionMastery(
        crafterCharacterId,
        potionTemplateId,
        masteryPoints
      );
    } else {
      console.log('No crafter character ID provided (likely NPC or Unknown)');
    }

    // Award mastery to supervisor if this was grunt work
    if (isGruntWork && supervisorCharacterId) {
      const supervisorMasteryPoints = calculateMasteryPoints(potency, false); // Supervisor always gets full mastery
      console.log(
        `Awarding ${supervisorMasteryPoints} points to supervisor ${supervisorCharacterId}`
      );
      await awardPotionMastery(
        supervisorCharacterId,
        potionTemplateId,
        supervisorMasteryPoints
      );
    }
  } catch (error) {
    console.error('Error awarding crafting mastery:', error);
    throw error;
  }
}

/**
 * Fetch all potion mastery for a specific character
 */
export async function getCharacterPotionMastery(characterId: string) {
  const database = db();

  try {
    const masteryData = await database
      .select({
        potionTemplateId: characterPotionMastery.potionTemplateId,
        masteryLevel: characterPotionMastery.masteryLevel,
        lastUpdated: characterPotionMastery.lastUpdated,
      })
      .from(characterPotionMastery)
      .where(eq(characterPotionMastery.characterId, characterId));

    return masteryData.map((m) => ({
      potionTemplateId: m.potionTemplateId,
      masteryLevel: m.masteryLevel,
      lastUpdated: m.lastUpdated.getTime(), // Convert Date to timestamp
    }));
  } catch (error) {
    console.error('Error fetching character potion mastery:', error);
    throw error;
  }
}

/**
 * Update or create mastery level for a character and potion
 */
export async function updateCharacterPotionMastery(
  characterId: string,
  potionTemplateId: string,
  masteryLevel: number
): Promise<void> {
  // Validate mastery level (0-10)
  const clampedLevel = Math.max(0, Math.min(10, masteryLevel));

  console.log(
    `Updating mastery for character ${characterId}, potion ${potionTemplateId} to level ${clampedLevel}`
  );

  const database = db();

  try {
    // Check if the character already has mastery for this potion
    const existingMastery = await database
      .select()
      .from(characterPotionMastery)
      .where(
        and(
          eq(characterPotionMastery.characterId, characterId),
          eq(characterPotionMastery.potionTemplateId, potionTemplateId)
        )
      )
      .limit(1);

    if (existingMastery.length > 0) {
      // Update existing mastery level
      await database
        .update(characterPotionMastery)
        .set({
          masteryLevel: clampedLevel,
          lastUpdated: sql`(unixepoch())`,
        })
        .where(
          and(
            eq(characterPotionMastery.characterId, characterId),
            eq(characterPotionMastery.potionTemplateId, potionTemplateId)
          )
        );
    } else {
      // Create new mastery record
      await database.insert(characterPotionMastery).values({
        characterId,
        potionTemplateId,
        masteryLevel: clampedLevel,
        lastUpdated: sql`(unixepoch())`,
      });
    }
  } catch (error) {
    console.error('Error updating character potion mastery:', error);
    throw error;
  }
}

/**
 * Get a character's current spell mastery levels
 */
export async function getCharacterSpellMastery(characterId: string): Promise<
  Array<{
    spellTemplateId: string;
    masteryLevel: number;
    lastUpdated: number;
  }>
> {
  const database = db();

  const mastery = await database
    .select({
      spellTemplateId: characterSpellMastery.spellTemplateId,
      masteryLevel: characterSpellMastery.masteryLevel,
      lastUpdated: characterSpellMastery.lastUpdated,
    })
    .from(characterSpellMastery)
    .where(eq(characterSpellMastery.characterId, characterId));

  return mastery.map((m) => ({
    spellTemplateId: m.spellTemplateId,
    masteryLevel: m.masteryLevel,
    lastUpdated: m.lastUpdated.getTime(), // Convert Date to timestamp
  }));
}

/**
 * Update a character's mastery level for a specific spell template
 */
export async function updateCharacterSpellMastery(
  characterId: string,
  spellTemplateId: string,
  masteryLevel: number
): Promise<void> {
  // Clamp mastery level between 0 and 10
  const clampedLevel = Math.max(0, Math.min(10, masteryLevel));

  console.log(
    `Updating spell mastery for character ${characterId}, spell ${spellTemplateId} to level ${clampedLevel}`
  );

  const database = db();

  try {
    // Check if the character already has mastery for this spell
    const existingMastery = await database
      .select()
      .from(characterSpellMastery)
      .where(
        and(
          eq(characterSpellMastery.characterId, characterId),
          eq(characterSpellMastery.spellTemplateId, spellTemplateId)
        )
      )
      .limit(1);

    if (existingMastery.length > 0) {
      // Update existing mastery level
      await database
        .update(characterSpellMastery)
        .set({
          masteryLevel: clampedLevel,
          lastUpdated: sql`(unixepoch())`,
        })
        .where(
          and(
            eq(characterSpellMastery.characterId, characterId),
            eq(characterSpellMastery.spellTemplateId, spellTemplateId)
          )
        );
    } else {
      // Create new mastery record
      await database.insert(characterSpellMastery).values({
        characterId,
        spellTemplateId,
        masteryLevel: clampedLevel,
        lastUpdated: sql`(unixepoch())`,
      });
    }
  } catch (error) {
    console.error('Error updating character spell mastery:', error);
    throw error;
  }
}

/**
 * Award mastery points to a character for a specific spell template
 */
export async function awardSpellMastery(
  characterId: string,
  spellTemplateId: string,
  masteryPoints: number
): Promise<void> {
  if (masteryPoints <= 0) {
    return; // No mastery to award
  }

  console.log(
    `Awarding ${masteryPoints} mastery points to character ${characterId} for spell template ${spellTemplateId}`
  );

  const database = db();

  try {
    // Get current mastery level
    const currentMastery = await database
      .select()
      .from(characterSpellMastery)
      .where(
        and(
          eq(characterSpellMastery.characterId, characterId),
          eq(characterSpellMastery.spellTemplateId, spellTemplateId)
        )
      )
      .limit(1);

    const currentLevel =
      currentMastery.length > 0 ? currentMastery[0].masteryLevel : 0;
    const newLevel = Math.min(10, currentLevel + masteryPoints); // Cap at 10

    // Update mastery level
    await updateCharacterSpellMastery(characterId, spellTemplateId, newLevel);

    console.log(
      `Spell mastery updated: ${currentLevel} -> ${newLevel} for character ${characterId}, spell ${spellTemplateId}`
    );
  } catch (error) {
    console.error('Error awarding spell mastery:', error);
    throw error;
  }
}
