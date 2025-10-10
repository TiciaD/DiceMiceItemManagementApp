'use client';

import { useState } from 'react';
import { ClassCard } from './ClassCard';
import { ClassDetailsModal } from './ClassDetailsModal';
import type { ClassWithDetails } from '@/types/classes';

interface ClassesSectionProps {
  classes: ClassWithDetails[];
}

export function ClassesSection({ classes }: ClassesSectionProps) {
  const [selectedClass, setSelectedClass] = useState<ClassWithDetails | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleClassClick = (classId: string) => {
    const classData = classes.find(c => c.id === classId);
    if (classData) {
      setSelectedClass(classData);
      setIsModalOpen(true);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedClass(null);
  };

  if (classes.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500 dark:text-gray-400">No classes available</p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {classes.map((classData) => (
          <ClassCard
            key={classData.id}
            id={classData.id}
            name={classData.name}
            description={classData.description}
            hitDie={classData.hitDie}
            prerequisiteStat1={classData.prerequisiteStat1}
            prerequisiteStat2={classData.prerequisiteStat2}
            onClick={handleClassClick}
          />
        ))}
      </div>

      <ClassDetailsModal
        classData={selectedClass}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />
    </>
  );
}