export interface Ability {
    id: string;
    name: string;
    description: string;
    levelRequired: number;
    damageMultiplier?: number;
    healAmount?: number;
    statusEffect?: string;
    // Add more optional properties here to define other types of ability effects
    // For example:
    // cooldown?: number;
    // duration?: number;
    // areaOfEffectRadius?: number;
    // targetType?: 'self' | 'singleTarget' | 'aoe';
}