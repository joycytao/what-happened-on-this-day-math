const REQUIRED_LEVELS = ['level1', 'level2', 'level3'];
const LEVEL_1_SKILLS = new Set(['addition', 'subtraction']);
const LEVEL_2_SKILLS = new Set(['multiplication', 'division', 'equal-sharing', 'simple-scale', 'basic-measurement']);
const LEVEL_3_SKILLS = new Set(['multi-step', 'unit-conversion', 'time', 'money', 'proportional-reasoning', 'logical-measurement']);

function addError(errors, message) {
  errors.push(message);
}

function hasAnySkill(level, accepted) {
  return Array.isArray(level?.allowedSkills) && level.allowedSkills.some((skill) => accepted.has(skill));
}

export function validateDifferentiationFramework(framework) {
  const errors = [];
  if (!framework || typeof framework !== 'object') {
    return { valid: false, errors: ['framework must be an object'], examples: 0 };
  }
  if (framework.schemaVersion !== '1.0.0') addError(errors, 'schemaVersion must be 1.0.0');
  if (framework.frameworkId !== 'one-story-three-levels') addError(errors, 'frameworkId must be one-story-three-levels');
  if (!Array.isArray(framework.sharedStoryRequirements) || framework.sharedStoryRequirements.length < 3) {
    addError(errors, 'sharedStoryRequirements must contain at least three requirements');
  }
  if (!framework.levels || typeof framework.levels !== 'object' || Object.keys(framework.levels).sort().join(',') !== REQUIRED_LEVELS.join(',')) {
    addError(errors, 'levels must contain exactly level1, level2, and level3');
  }

  const level1 = framework.levels?.level1;
  const level2 = framework.levels?.level2;
  const level3 = framework.levels?.level3;
  if (level1?.numberRange?.max > 50) addError(errors, 'levels.level1.numberRange.max must be at most 50');
  if (level1?.maxReasoningSteps !== 1) addError(errors, 'levels.level1.maxReasoningSteps must be 1');
  if (!hasAnySkill(level1, LEVEL_1_SKILLS)) addError(errors, 'levels.level1 must allow addition or subtraction');
  if (level2?.maxReasoningSteps !== 2) addError(errors, 'levels.level2.maxReasoningSteps must be 2');
  if (!hasAnySkill(level2, LEVEL_2_SKILLS)) addError(errors, 'levels.level2 must allow a multiplication, division, sharing, scale, or measurement skill');
  if (level3?.minReasoningSteps < 2) addError(errors, 'levels.level3.minReasoningSteps must be at least 2');
  if (!hasAnySkill(level3, LEVEL_3_SKILLS)) addError(errors, 'levels.level3 must allow a multi-step, conversion, time, money, proportional, or logical-measurement skill');

  if (!Array.isArray(framework.examples) || framework.examples.length < 3) {
    addError(errors, 'examples must contain at least three entries');
  }
  for (const [index, example] of (framework.examples ?? []).entries()) {
    const prefix = `examples[${index}]`;
    if (typeof example.date !== 'string' || !example.date.startsWith('October ')) addError(errors, `${prefix}.date must be an October date`);
    if (example.sharedStory !== true) addError(errors, `${prefix}.sharedStory must be true`);
    const levels = example.levels;
    if (!levels || REQUIRED_LEVELS.some((level) => typeof levels[level]?.skillFamily !== 'string')) {
      addError(errors, `${prefix}.levels must define skillFamily for all three levels`);
      continue;
    }
    const families = REQUIRED_LEVELS.map((level) => levels[level].skillFamily);
    if (new Set(families).size !== families.length) addError(errors, `${prefix}.levels must use distinct skill families`);
    for (const level of REQUIRED_LEVELS) {
      if (!Array.isArray(levels[level].storyNumberRefs) || levels[level].storyNumberRefs.length === 0) {
        addError(errors, `${prefix}.levels.${level}.storyNumberRefs must contain at least one number`);
      }
    }
  }
  return { valid: errors.length === 0, errors, examples: Array.isArray(framework.examples) ? framework.examples.length : 0 };
}
