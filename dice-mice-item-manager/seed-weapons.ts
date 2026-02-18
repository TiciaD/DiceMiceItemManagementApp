import { db } from './src/db/client';
import { weaponTemplates, weaponTemplateDamageTypes } from './src/db/schema';
import { createId } from '@paralleldrive/cuid2';

async function seedWeaponTemplates() {
  const database = db();

  console.log('Seeding weapon templates...');

  // Define weapon templates with their damage types
  const templates = [
    {
      name: 'Dagger',
      handedness: '1H' as const,
      damageMode: 'single' as const,
      modeCode: 'thrown_short' as const,
      description: 'A small, easily concealed blade ideal for quick strikes and throwing.',
      damageTypes: [{ code: 'P' as const, threshold: 11, order: 0 }],
    },
    {
      name: 'Shortsword',
      handedness: '1H' as const,
      damageMode: 'single' as const,
      modeCode: 'none' as const,
      description: 'A versatile one-handed blade, suitable for slashing and thrusting.',
      damageTypes: [{ code: 'S' as const, threshold: 11, order: 0 }],
    },
    {
      name: 'Longsword',
      handedness: '1H' as const,
      damageMode: 'single' as const,
      modeCode: 'versatile' as const,
      description: 'A classic knightly weapon that can be wielded with one or two hands.',
      damageTypes: [{ code: 'S' as const, threshold: 13, order: 0 }],
    },
    {
      name: 'Rapier',
      handedness: '1H' as const,
      damageMode: 'single' as const,
      modeCode: 'none' as const,
      description: 'An elegant thrusting weapon favored by duelists.',
      damageTypes: [{ code: 'P' as const, threshold: 13, order: 0 }],
    },
    {
      name: 'Mace',
      handedness: '1H' as const,
      damageMode: 'single' as const,
      modeCode: 'none' as const,
      description: 'A heavy bludgeoning weapon effective against armored foes.',
      damageTypes: [{ code: 'B' as const, threshold: 11, order: 0 }],
    },
    {
      name: 'Morningstar',
      handedness: '1H' as const,
      damageMode: 'dual' as const,
      modeCode: 'none' as const,
      description: 'A spiked mace that can both bludgeon and pierce.',
      damageTypes: [
        { code: 'B' as const, threshold: 11, order: 0 },
        { code: 'P' as const, threshold: 11, order: 1 },
      ],
    },
    {
      name: 'Greatsword',
      handedness: '2H' as const,
      damageMode: 'single' as const,
      modeCode: 'none' as const,
      description: 'A massive two-handed blade dealing devastating slashing damage.',
      damageTypes: [{ code: 'S' as const, threshold: 15, order: 0 }],
    },
    {
      name: 'Spear',
      handedness: '1H' as const,
      damageMode: 'single' as const,
      modeCode: 'thrown_short' as const,
      description: 'A polearm that can be used for thrusting or throwing.',
      damageTypes: [{ code: 'P' as const, threshold: 11, order: 0 }],
    },
    {
      name: 'Halberd',
      handedness: '2H' as const,
      damageMode: 'dual' as const,
      modeCode: 'reach_10' as const,
      description: 'A versatile polearm with axe blade and spike, providing reach.',
      damageTypes: [
        { code: 'S' as const, threshold: 13, order: 0 },
        { code: 'P' as const, threshold: 13, order: 1 },
      ],
    },
    {
      name: 'Warhammer',
      handedness: '1H' as const,
      damageMode: 'single' as const,
      modeCode: 'none' as const,
      description: 'A heavy hammer designed to crush armor.',
      damageTypes: [{ code: 'B' as const, threshold: 13, order: 0 }],
    },
    {
      name: 'Greataxe',
      handedness: '2H' as const,
      damageMode: 'single' as const,
      modeCode: 'none' as const,
      description: 'A massive axe wielded with two hands for brutal cleaving attacks.',
      damageTypes: [{ code: 'S' as const, threshold: 15, order: 0 }],
    },
    {
      name: 'Pike',
      handedness: '2H' as const,
      damageMode: 'single' as const,
      modeCode: 'reach_15' as const,
      description: 'A long polearm designed for keeping enemies at extreme distance.',
      damageTypes: [{ code: 'P' as const, threshold: 13, order: 0 }],
    },
  ];

  // Insert each template
  for (const template of templates) {
    const templateId = createId();

    // Insert template
    await database.insert(weaponTemplates).values({
      id: templateId,
      name: template.name,
      handedness: template.handedness,
      damageMode: template.damageMode,
      modeCode: template.modeCode,
      description: template.description,
    });

    // Insert damage types
    for (const dt of template.damageTypes) {
      await database.insert(weaponTemplateDamageTypes).values({
        weaponTemplateId: templateId,
        damageTypeCode: dt.code,
        suggestedStatThreshold: dt.threshold,
        displayOrder: dt.order,
      });
    }

    console.log(`  ✓ ${template.name}`);
  }

  console.log(`\n✅ Seeded ${templates.length} weapon templates`);
}

seedWeaponTemplates()
  .then(() => {
    console.log('Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error seeding weapon templates:', error);
    process.exit(1);
  });
