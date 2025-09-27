import { db } from '@/db/client';
import { potionTemplates, potions, userPotions } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { CreatePotionFormData } from '@/types/potions';

export async function getAllPotionTemplates() {
  try {
    const database = db();
    const templates = await database.select().from(potionTemplates);

    // Parse JSON props for each template
    return templates.map((template) => ({
      ...template,
      propsData: template.propsJson ? JSON.parse(template.propsJson) : null,
    }));
  } catch (error) {
    console.error('Error fetching potion templates:', error);
    return [];
  }
}

export async function getPotionTemplateById(id: string) {
  try {
    const database = db();
    const [template] = await database
      .select()
      .from(potionTemplates)
      .where(eq(potionTemplates.id, id));

    if (!template) return null;

    return {
      ...template,
      propsData: template.propsJson ? JSON.parse(template.propsJson) : null,
    };
  } catch (error) {
    console.error('Error fetching potion template:', error);
    return null;
  }
}

export async function createPotionInstance(
  formData: CreatePotionFormData,
  userId: string
) {
  try {
    const database = db();

    // Create the potion instance
    const [newPotion] = await database
      .insert(potions)
      .values({
        customId: formData.customId,
        potionTemplateId: formData.potionTemplateId,
        craftedPotency: formData.craftedPotency,
        craftedBy: formData.craftedBy,
        craftedAt: formData.craftedAt,
        weight: formData.weight,
        consumedBy: null,
        consumedAt: null,
      })
      .returning();

    // Create the user-potion relationship
    await database.insert(userPotions).values({
      potionId: newPotion.id,
      userId: userId,
    });

    return newPotion;
  } catch (error) {
    console.error('Error creating potion instance:', error);
    throw new Error('Failed to create potion instance');
  }
}

export async function getUserPotions(userId: string) {
  try {
    const database = db();

    // Get all potions for the user with their templates
    const userPotionsWithTemplates = await database
      .select({
        // Potion instance data
        id: potions.id,
        customId: potions.customId,
        craftedPotency: potions.craftedPotency,
        craftedBy: potions.craftedBy,
        craftedAt: potions.craftedAt,
        weight: potions.weight,
        consumedBy: potions.consumedBy,
        consumedAt: potions.consumedAt,
        // Template data
        templateId: potionTemplates.id,
        templateName: potionTemplates.name,
        templateLevel: potionTemplates.level,
        templateSchool: potionTemplates.school,
        templateRarity: potionTemplates.rarity,
        templateDescription: potionTemplates.description,
        templateCost: potionTemplates.cost,
        templateSplitAmount: potionTemplates.splitAmount,
        templateSpecialIngredient: potionTemplates.specialIngredient,
        templatePropsJson: potionTemplates.propsJson,
        templatePotencyFailEffect: potionTemplates.potencyFailEffect,
        templatePotencySuccessEffect: potionTemplates.potencySuccessEffect,
        templatePotencyCriticalSuccessEffect:
          potionTemplates.potencyCriticalSuccessEffect,
      })
      .from(userPotions)
      .innerJoin(potions, eq(userPotions.potionId, potions.id))
      .innerJoin(
        potionTemplates,
        eq(potions.potionTemplateId, potionTemplates.id)
      )
      .where(eq(userPotions.userId, userId));

    // Transform the data to a more usable format
    return userPotionsWithTemplates.map((row) => ({
      id: row.id,
      customId: row.customId,
      craftedPotency: row.craftedPotency,
      craftedBy: row.craftedBy,
      craftedAt: row.craftedAt,
      weight: row.weight,
      consumedBy: row.consumedBy,
      consumedAt: row.consumedAt,
      template: {
        id: row.templateId,
        name: row.templateName,
        level: row.templateLevel,
        school: row.templateSchool,
        rarity: row.templateRarity,
        description: row.templateDescription,
        cost: row.templateCost,
        splitAmount: row.templateSplitAmount,
        specialIngredient: row.templateSpecialIngredient,
        propsJson: row.templatePropsJson,
        potencyFailEffect: row.templatePotencyFailEffect,
        potencySuccessEffect: row.templatePotencySuccessEffect,
        potencyCriticalSuccessEffect: row.templatePotencyCriticalSuccessEffect,
        propsData: row.templatePropsJson
          ? JSON.parse(row.templatePropsJson)
          : null,
      },
    }));
  } catch (error) {
    console.error('Error fetching user potions:', error);
    return [];
  }
}
