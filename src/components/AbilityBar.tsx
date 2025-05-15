import React from 'react';
import { Ability } from '../types/ability';

interface AbilityBarProps {
  unlockedAbilities: Ability[];
  onUseAbility: (abilityId: string) => void;
}

const AbilityBar: React.FC<AbilityBarProps> = ({ unlockedAbilities, onUseAbility }) => {
  return (
    <div className="ability-bar">
      <h3>Abilities</h3>
      <div className="ability-list">
        {unlockedAbilities.map(ability => (
          <button
            key={ability.id}
            className="ability-button"
            onClick={() => onUseAbility(ability.id)}
            title={ability.description} // Optional: Add description as tooltip
          >
            {ability.name}
          </button>
        ))}
      </div>
    </div>
  );
};

export default AbilityBar;