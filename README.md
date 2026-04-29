# Romance of the Wastes — Playable Prototype

A small **client-side** strategic simulation RPG prototype inspired by character-driven grand strategy loops (RTK-style), set in a postapocalyptic wasteland.

This repository contains the **first playable campaign loop**, not a full game.

## Prototype Scope

This version intentionally focuses on transparent simulation code and a lightweight UI.

Implemented:
- Procedural campaign generation:
  - 6 settlements
  - 3 factions
  - 18 characters
  - 1 generated player character (minor officer)
- Monthly turn loop:
  - One player action per month
  - Settlement resource simulation
  - AI faction action simulation
  - Event log storytelling
- Abstract settlement warfare with ownership transfer
- Simple map/details/lists panels for playability

Not implemented (by design):
- Tactical battle scenes
- Inventory/equipment systems
- Quests/story arcs
- Save/load persistence
- Backend/database

---

## Tech Stack

- React 18
- TypeScript 5
- Vite 5
- Plain CSS

Everything runs client-side in-browser.

---

## Getting Started

### 1) Install dependencies

```bash
npm install
```

### 2) Run development server

```bash
npm run dev
```

Then open the local URL shown by Vite (typically `http://localhost:5173`).

### 3) Production build

```bash
npm run build
```

### 4) Preview production build

```bash
npm run preview
```

---

## Gameplay Loop (Current)

Each month:
1. Player chooses exactly one action.
2. Action resolves immediately and writes to event log.
3. World advances one month.
4. Settlements update resources/morale.
5. AI factions each take a basic strategic action.
6. Event log records major events.

Goal while testing: survive and expand faction control by capturing hostile settlements.

---

## Data Model Overview

### Settlement
Each settlement tracks:
- `id`, `name`, `x`, `y`
- `ownerFactionId`
- `population`
- `food`, `water`, `scrap`
- `defenses`, `morale`
- `stationedCharacterIds`

### Faction
Each faction tracks:
- `id`, `name`, `ideology`, `color`
- `leaderCharacterId`
- `controlledSettlementIds`
- `attitudes` toward other factions

### Character
Each character tracks:
- `id`, `name`
- `factionId`, `locationSettlementId`
- `combat`, `leadership`, `diplomacy`, `engineering`, `scavenging`
- `loyalty`, `ambition`, `reputation`
- relationship values for selected other characters

---

## Player Actions

The player can take one of the following actions each month:

- **Travel**: Move to another settlement.
- **Scavenge**: Gain settlement scrap or food (weighted by scavenging).
- **Train**: Improve combat or leadership slightly.
- **Improve Settlement**: Raise defenses or morale (weighted by engineering/leadership).
- **Recruit**: Bolster local militia/defenses (weighted by leadership/reputation).
- **Attack Settlement**: Attack a nearby enemy settlement and potentially seize it.

---

## Combat Rules (Abstract)

Combat is resolved numerically (no tactical layer):

- Attacker strength uses:
  - attacking character combat + leadership
  - local support/bonuses
  - randomness
- Defender strength uses:
  - defending character combat + leadership
  - settlement defenses
  - morale
  - randomness

Outcomes:
- **Attacker win**: settlement ownership changes.
- **Defender win**: settlement holds.
- Both sides may lose morale/resources post-battle.
- Event log records results in readable text.

---

## UI Overview

Main screen includes:
- Campaign header + month counter
- Generate new campaign button
- Wasteland node map (clickable settlements)
- Selected settlement detail panel
- Faction status list
- Character list
- Player status panel
- Action controls
- Event log

---

## Balancing Notes

This prototype intentionally uses simple formulas and random ranges. Tuning can be done quickly in `src/App.tsx` by adjusting:
- stat generation ranges
- monthly resource production/consumption
- morale drift
- combat support terms
- AI behavior weights

---

## Suggested Manual Test Plan

1. Generate a new campaign.
2. Confirm counts: 6 settlements, 3 factions, 18 characters.
3. Take each player action at least once.
4. Advance 12+ months.
5. Confirm AI factions log actions each month.
6. Trigger at least one battle.
7. Confirm at least one ownership change from battle.
8. Confirm event log updates every turn.
9. Continue to 24+ months and confirm no crash.

---

## Project Structure

```text
.
├── index.html
├── package.json
├── tsconfig.json
├── tsconfig.node.json
├── vite.config.ts
└── src
    ├── App.tsx
    ├── main.tsx
    └── styles.css
```

---

## Current Limitations

- No persistence between refreshes
- No pathfinding/terrain effects
- No diplomatic action UI yet
- No troop units beyond abstracted defense/morale/support
- AI strategy is intentionally basic

---

## Next Iteration Ideas

- Add save/load JSON export/import
- Add explicit unit/militia pools per settlement
- Add officer assignment management (governor/garrison roles)
- Add simple diplomacy actions (aid/threat/truce)
- Add relationship-driven character events and defections

