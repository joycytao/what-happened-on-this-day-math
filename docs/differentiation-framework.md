# One-story, three-level differentiation framework

This contract keeps one daily historical story together while giving three
learner profiles genuinely different mathematical work. It is designed for
future monthly generation: a generator can select one story, extract its
numbers, and map each level to a defined skill family without inventing a new
rule for every date.

## Shared story contract

- All three levels use the same calendar date, historical event, and story
  numbers.
- Every number in a prompt must appear in the reading passage or be an
  explicitly stated conversion fact, such as `1 kilogram = 1,000 grams`.
- Each level has a named skill family, equation or equations, and one clear
  final answer with a unit or meaning.
- Level 2 and Level 3 cannot be made by merely adding words or changing the
  Level 1 numbers.

## Level definitions

| Level | Learner profile | Number and reasoning boundary | Required mathematical idea |
| --- | --- | --- | --- |
| Level 1 | Lower elementary | Normally at most 50; one short operation | Direct addition or subtraction; literal wording and low reading load |
| Level 2 | Middle elementary | Normally at most 1,000; at most two reasoning steps | Multiplication, division, equal sharing, simple scale, or basic measurement |
| Level 3 | Upper elementary | Elementary-sized values; at least two reasoning steps when appropriate | Multi-step reasoning, unit conversion, time, money, proportional reasoning, or logical measurement |

These are design boundaries, not permission to add unrelated numbers. The
story remains the source of context, and a conversion fact must be stated in
the passage or task when it is needed.

## Operation-family decision rules

1. Start with the story numbers that have a natural relationship.
2. Choose Level 1 when one addition or subtraction makes that relationship
   concrete.
3. Choose Level 2 when the same relationship naturally supports groups, equal
   sharing, a rate, a scale, or a basic measurement comparison.
4. Choose Level 3 when a second relationship is needed: elapsed time, money,
   unit conversion, a comparison, an average, a remainder, or a multi-step
   plan.
5. Reject a draft when two levels use the same skill family, when a level uses
   numbers absent from the story, or when the “harder” level is only longer.

## October examples

The machine-readable source of truth for these examples is
`examples/differentiation-framework.example.json`.

- **October 1 — The Model T reaches its first customer:** Level 1 adds tires
  across cars; Level 2 scales cars per hour across a work period; Level 3
  combines elapsed years with a monthly-savings calculation.
- **October 8 — Octopus Day:** Level 1 counts repeated arms; Level 2 combines
  repeated heart and brain facts; Level 3 converts kilograms to grams before
  comparing weights.
- **October 24 — The Erie Canal opens:** Level 1 counts boats; Level 2
  compares wagon and boat travel times; Level 3 uses distance and speed to
  calculate travel time and convert hours to days and hours.

The examples demonstrate a progression in mathematical structure while
keeping the dated story constant within each example.

## Validation and handoff

Run `npm run differentiation:validate` before using this contract in a new
month. The validator checks the three level definitions, the shared-story
requirement, distinct skill families, story-number references, and the three
October examples. It writes a JSON evidence report for Issue #79. Content and
mathematics gates are represented in that report; PDF/layout validation is not
applicable because this issue changes no rendered artifact.
