import { useMemo, useState } from 'react';

type Settlement = {
  id: string;
  name: string;
  x: number;
  y: number;
  ownerFactionId: string;
  population: number;
  food: number;
  water: number;
  scrap: number;
  defenses: number;
  morale: number;
  stationedCharacterIds: string[];
};

type Faction = {
  id: string;
  name: string;
  ideology: string;
  color: string;
  leaderCharacterId: string;
  controlledSettlementIds: string[];
  attitudes: Record<string, number>;
};

type Character = {
  id: string;
  name: string;
  factionId: string;
  locationSettlementId: string;
  combat: number;
  leadership: number;
  diplomacy: number;
  engineering: number;
  scavenging: number;
  loyalty: number;
  ambition: number;
  reputation: number;
  relationships: Record<string, number>;
};

type Campaign = {
  month: number;
  settlements: Settlement[];
  factions: Faction[];
  characters: Character[];
  playerCharacterId: string;
  playerFactionId: string;
  log: string[];
  actionUsed: boolean;
};

const r = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const pick = <T,>(arr: T[]) => arr[r(0, arr.length - 1)];

const neighbors = (a: Settlement, b: Settlement) => Math.hypot(a.x - b.x, a.y - b.y) <= 140;

function generateCampaign(): Campaign {
  const settlementNames = ['Ash Depot', 'Mercy Station', 'Redmarket', 'Blackwell', 'Shatter Point', 'Drylight'];
  const factionDefs = [
    { id: 'f1', name: 'Iron Choir', ideology: 'Order through steel', color: '#d94848' },
    { id: 'f2', name: 'Dust Banner', ideology: 'Nomad merit', color: '#d4a027' },
    { id: 'f3', name: 'Glass Wardens', ideology: 'Tech preservation', color: '#4f8ee8' }
  ];

  const settlements: Settlement[] = settlementNames.map((name, i) => ({
    id: `s${i + 1}`,
    name,
    x: r(30, 470),
    y: r(30, 310),
    ownerFactionId: factionDefs[i % 3].id,
    population: r(80, 230),
    food: r(40, 90),
    water: r(40, 90),
    scrap: r(20, 70),
    defenses: r(15, 45),
    morale: r(45, 75),
    stationedCharacterIds: []
  }));

  const firstNames = ['Mara', 'Jax', 'Sable', 'Orin', 'Kara', 'Voss', 'Nila', 'Brant', 'Iris', 'Rook'];
  const lastNames = ['Drake', 'Vale', 'Stone', 'Kell', 'Voss', 'Grey', 'Ruin', 'Serr', 'Quill', 'Ward'];
  const characters: Character[] = Array.from({ length: 18 }).map((_, i) => {
    const factionId = factionDefs[i % 3].id;
    const home = pick(settlements.filter((s) => s.ownerFactionId === factionId));
    return {
      id: `c${i + 1}`,
      name: `${pick(firstNames)} ${pick(lastNames)}`,
      factionId,
      locationSettlementId: home.id,
      combat: r(30, 80),
      leadership: r(30, 80),
      diplomacy: r(20, 80),
      engineering: r(20, 80),
      scavenging: r(20, 80),
      loyalty: r(40, 95),
      ambition: r(20, 90),
      reputation: r(20, 80),
      relationships: {}
    };
  });

  characters.forEach((c) => {
    const others = characters.filter((o) => o.id !== c.id);
    for (let i = 0; i < 3; i++) {
      const target = pick(others);
      c.relationships[target.id] = r(-40, 80);
    }
  });

  settlements.forEach((s) => {
    s.stationedCharacterIds = characters.filter((c) => c.locationSettlementId === s.id).map((c) => c.id);
  });

  const factions: Faction[] = factionDefs.map((f) => {
    const roster = characters.filter((c) => c.factionId === f.id);
    const leader = roster.reduce((a, b) => (a.leadership + a.reputation > b.leadership + b.reputation ? a : b));
    const attitudes: Record<string, number> = {};
    factionDefs.forEach((o) => {
      if (o.id !== f.id) attitudes[o.id] = r(-50, 30);
    });
    return {
      ...f,
      leaderCharacterId: leader.id,
      controlledSettlementIds: settlements.filter((s) => s.ownerFactionId === f.id).map((s) => s.id),
      attitudes
    };
  });

  const playerFaction = factions[0];
  const playerCharacter = characters.find((c) => c.factionId === playerFaction.id) as Character;
  playerCharacter.reputation = Math.max(25, playerCharacter.reputation - 10);

  return {
    month: 1,
    settlements,
    factions,
    characters,
    playerCharacterId: playerCharacter.id,
    playerFactionId: playerFaction.id,
    log: ['A new wasteland campaign begins.'],
    actionUsed: false
  };
}

function getCombatPower(char: Character, settlement: Settlement, support: number) {
  return char.combat + char.leadership + settlement.morale / 2 + support + r(-15, 15);
}

export function App() {
  const [campaign, setCampaign] = useState<Campaign>(() => generateCampaign());
  const [selectedSettlementId, setSelectedSettlementId] = useState<string>(campaign.settlements[0].id);

  const byId = <T extends { id: string }>(arr: T[], id: string) => arr.find((x) => x.id === id)!;
  const selectedSettlement = useMemo(() => byId(campaign.settlements, selectedSettlementId), [campaign, selectedSettlementId]);
  const player = byId(campaign.characters, campaign.playerCharacterId);

  const apply = (fn: (c: Campaign) => Campaign) => setCampaign((prev) => fn(structuredClone(prev)));

  const log = (c: Campaign, msg: string) => c.log.unshift(`Month ${c.month}: ${msg}`);

  const endTurn = (c: Campaign) => {
    c.settlements.forEach((s) => {
      const popLoad = Math.floor(s.population / 40);
      s.food += r(4, 10) - popLoad;
      s.water += r(4, 10) - popLoad;
      if (s.food < 0 || s.water < 0) s.morale -= r(4, 10);
      else s.morale += r(0, 3);
      s.food = Math.max(0, s.food);
      s.water = Math.max(0, s.water);
      s.morale = Math.max(5, Math.min(95, s.morale));
    });

    for (const f of c.factions.filter((f) => f.id !== c.playerFactionId)) {
      const owned = c.settlements.filter((s) => s.ownerFactionId === f.id);
      if (owned.length === 0) continue;
      const weak = owned.find((s) => s.defenses < 25);
      const option = weak ? 'recruit' : pick(['improve', 'attack', 'recruit']);
      if (option === 'improve') {
        const st = pick(owned);
        st.defenses += r(3, 8);
        st.morale += r(1, 5);
        log(c, `${f.name} fortified ${st.name}.`);
      } else if (option === 'recruit') {
        const st = pick(owned);
        st.defenses += r(2, 6);
        log(c, `${f.name} rallied militia at ${st.name}.`);
      } else {
        const origin = pick(owned);
        const targets = c.settlements.filter((s) => s.ownerFactionId !== f.id && neighbors(origin, s));
        if (targets.length === 0) continue;
        const target = pick(targets);
        const atkChar = pick(c.characters.filter((ch) => ch.factionId === f.id && ch.locationSettlementId === origin.id));
        const defCharPool = c.characters.filter((ch) => ch.factionId === target.ownerFactionId && ch.locationSettlementId === target.id);
        const defChar = defCharPool.length ? pick(defCharPool) : pick(c.characters.filter((ch) => ch.factionId === target.ownerFactionId));
        const atk = getCombatPower(atkChar, origin, origin.defenses / 3 + 8);
        const def = getCombatPower(defChar, target, target.defenses + 6);
        if (atk > def) {
          const old = byId(c.factions, target.ownerFactionId);
          target.ownerFactionId = f.id;
          target.morale = Math.max(20, target.morale - 10);
          target.food = Math.max(0, target.food - r(5, 12));
          target.water = Math.max(0, target.water - r(5, 12));
          log(c, `${f.name} seized ${target.name} from ${old.name}.`);
        } else {
          target.morale = Math.max(5, target.morale - r(3, 8));
          origin.morale = Math.max(5, origin.morale - r(2, 6));
          log(c, `${f.name} attacked ${target.name} but failed.`);
        }
      }
    }

    c.factions.forEach((f) => {
      f.controlledSettlementIds = c.settlements.filter((s) => s.ownerFactionId === f.id).map((s) => s.id);
    });

    c.month += 1;
    c.actionUsed = false;
  };

  const doAction = (action: string, targetId?: string) => apply((c) => {
    if (c.actionUsed) return c;
    const p = byId(c.characters, c.playerCharacterId);
    const here = byId(c.settlements, p.locationSettlementId);

    if (action === 'travel' && targetId) {
      const to = byId(c.settlements, targetId);
      p.locationSettlementId = to.id;
      log(c, `${p.name} traveled from ${here.name} to ${to.name}.`);
    }
    if (action === 'scavenge') {
      const scrapGain = r(4, 10) + Math.floor(p.scavenging / 12);
      const foodGain = r(1, 6);
      if (Math.random() > 0.4) {
        here.scrap += scrapGain;
        log(c, `${p.name} scavenged ${scrapGain} scrap near ${here.name}.`);
      } else {
        here.food += foodGain;
        log(c, `${p.name} recovered ${foodGain} food caches near ${here.name}.`);
      }
    }
    if (action === 'train') {
      if (Math.random() > 0.5) {
        p.combat += 1;
        log(c, `${p.name} trained fighters and gained combat skill.`);
      } else {
        p.leadership += 1;
        log(c, `${p.name} drilled officers and gained leadership.`);
      }
    }
    if (action === 'improve') {
      if (Math.random() > 0.5) {
        const boost = 2 + Math.floor(p.engineering / 30);
        here.defenses += boost;
        log(c, `${p.name} improved defenses at ${here.name} by ${boost}.`);
      } else {
        const boost = 2 + Math.floor(p.leadership / 30);
        here.morale = Math.min(95, here.morale + boost);
        log(c, `${p.name} raised morale in ${here.name} by ${boost}.`);
      }
    }
    if (action === 'recruit') {
      const boost = 2 + Math.floor((p.leadership + p.reputation) / 40);
      here.defenses += boost;
      here.morale = Math.min(95, here.morale + 1);
      log(c, `${p.name} recruited locals at ${here.name}, bolstering defenses by ${boost}.`);
    }
    if (action === 'attack' && targetId) {
      const target = byId(c.settlements, targetId);
      if (target.ownerFactionId !== p.factionId) {
        const defenders = c.characters.filter((ch) => ch.factionId === target.ownerFactionId && ch.locationSettlementId === target.id);
        const defChar = defenders[0] ?? c.characters.find((ch) => ch.factionId === target.ownerFactionId)!;
        const atk = getCombatPower(p, here, here.defenses / 2 + 10);
        const def = getCombatPower(defChar, target, target.defenses + target.morale / 3);
        if (atk > def) {
          const oldFaction = byId(c.factions, target.ownerFactionId);
          target.ownerFactionId = p.factionId;
          target.defenses = Math.max(8, Math.floor(target.defenses * 0.7));
          target.morale = Math.max(20, target.morale - 15);
          log(c, `${p.name} captured ${target.name} from ${oldFaction.name} after a brutal siege.`);
        } else {
          here.morale = Math.max(5, here.morale - r(3, 7));
          target.morale = Math.max(5, target.morale - r(1, 4));
          log(c, `${p.name} attacked ${target.name} but was repelled.`);
        }
      }
    }

    c.factions.forEach((f) => {
      f.controlledSettlementIds = c.settlements.filter((s) => s.ownerFactionId === f.id).map((s) => s.id);
    });
    c.actionUsed = true;
    endTurn(c);
    return c;
  });

  const location = byId(campaign.settlements, player.locationSettlementId);
  const adjacentEnemies = campaign.settlements.filter((s) => s.ownerFactionId !== player.factionId && neighbors(location, s));

  return (
    <div className="app">
      <h1>Romance of the Wastes — Prototype</h1>
      <div className="toolbar">
        <button onClick={() => { const fresh = generateCampaign(); setCampaign(fresh); setSelectedSettlementId(fresh.settlements[0].id); }}>Generate New Campaign</button>
        <span>Month: {campaign.month}</span>
      </div>
      <div className="grid">
        <section>
          <h3>Map</h3>
          <div className="map">{campaign.settlements.map((s) => {
            const owner = byId(campaign.factions, s.ownerFactionId);
            return <button key={s.id} style={{ left: s.x, top: s.y, background: owner.color }} className="node" onClick={() => setSelectedSettlementId(s.id)}>{s.name}</button>;
          })}</div>
        </section>
        <section>
          <h3>Settlement</h3>
          <p><strong>{selectedSettlement.name}</strong> ({byId(campaign.factions, selectedSettlement.ownerFactionId).name})</p>
          <p>Pop {selectedSettlement.population} | Food {selectedSettlement.food} | Water {selectedSettlement.water}</p>
          <p>Scrap {selectedSettlement.scrap} | Def {selectedSettlement.defenses} | Morale {selectedSettlement.morale}</p>
        </section>
        <section>
          <h3>Player</h3>
          <p>{player.name} of {byId(campaign.factions, player.factionId).name}</p>
          <p>At: {location.name}</p>
          <p>Cmb {player.combat} Ldr {player.leadership} Eng {player.engineering} Scv {player.scavenging}</p>
        </section>
        <section>
          <h3>Actions (1/month)</h3>
          <div className="actions">
            <button onClick={() => doAction('scavenge')}>Scavenge</button>
            <button onClick={() => doAction('train')}>Train</button>
            <button onClick={() => doAction('improve')}>Improve Settlement</button>
            <button onClick={() => doAction('recruit')}>Recruit</button>
            <select onChange={(e) => e.target.value && doAction('travel', e.target.value)} defaultValue="">
              <option value="">Travel…</option>
              {campaign.settlements.filter((s) => s.id !== location.id).map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            <select onChange={(e) => e.target.value && doAction('attack', e.target.value)} defaultValue="">
              <option value="">Attack…</option>
              {adjacentEnemies.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
        </section>
        <section>
          <h3>Factions</h3>
          {campaign.factions.map((f) => <p key={f.id}><span style={{ color: f.color }}>■</span> {f.name}: {f.controlledSettlementIds.length} settlements</p>)}
        </section>
        <section>
          <h3>Characters</h3>
          <div className="scroll">{campaign.characters.map((c) => <p key={c.id}>{c.name} ({byId(campaign.factions, c.factionId).name}) @ {byId(campaign.settlements, c.locationSettlementId).name}</p>)}</div>
        </section>
        <section className="log">
          <h3>Event Log</h3>
          <div className="scroll">{campaign.log.map((e, i) => <p key={`${e}-${i}`}>{e}</p>)}</div>
        </section>
      </div>
    </div>
  );
}
