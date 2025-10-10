'use client';

import { useState } from 'react';
import { SkillCard } from './SkillCard';
import { SkillDetailsModal } from './SkillDetailsModal';
import type { SkillWithDetails } from '@/types/skills';

interface SkillsSectionProps {
  skills: SkillWithDetails[];
}

export function SkillsSection({ skills }: SkillsSectionProps) {
  const [selectedSkill, setSelectedSkill] = useState<SkillWithDetails | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleSkillClick = (skillId: string) => {
    const skillData = skills.find(s => s.id === skillId);
    if (skillData) {
      setSelectedSkill(skillData);
      setIsModalOpen(true);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedSkill(null);
  };

  if (skills.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500 dark:text-gray-400">No skills available</p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {skills.map((skill) => (
          <SkillCard
            key={skill.id}
            id={skill.id}
            name={skill.name}
            description={skill.description}
            associatedStat={skill.associatedStat}
            abilitiesCount={skill.abilities.length}
            onClick={handleSkillClick}
          />
        ))}
      </div>

      <SkillDetailsModal
        skillData={selectedSkill}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />
    </>
  );
}