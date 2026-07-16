# 🌟 Rising Star Maker

A browser-based **star management game** — guide a raw talent from obscurity to global superstardom in 52 weeks!

## 🎮 How to Play

Open `index.html` in any modern browser (no build step required).

**Goal:** Reach **100 Fame** before the year ends to become a Superstar!

### Actions each week

| Action | Effect | Requirements |
|--------|--------|--------------|
| 🎸 Practice | +Talent, −10 Stamina | — |
| 🎭 Perform | +Fame, +Money, −20 Stamina | Stamina ≥ 20 |
| 🤝 Network | +Fame, −$500, −10 Stamina | $500 |
| 😴 Rest | +40 Stamina | — |
| 🎙️ Collaborate | +Fame (chance), −$1000, −15 Stamina | Talent ≥ 30, $1000 |
| 🚌 Tour | +Big Fame, +Big Money, −40 Stamina | Fame ≥ 25, Stamina ≥ 40 |

### Stats

- **⭐ Fame** — your popularity (0–100). Reach 100 to win!
- **🎵 Talent** — improves Fame/Money gains from performing
- **⚡ Stamina** — required for most actions; replenished by resting
- **💰 Money** — spent on networking and collaborations

### Milestones

10 → **Local Act** · 25 → **Local Celebrity** · 45 → **Regional Star** · 65 → **National Sensation** · 85 → **Global Icon** · 100 → **Superstar 👑**

Random events occur ~40% of turns — some help you, some hurt you. Plan ahead!

## 🚀 Running

```
# Just open the file directly:
open index.html

# Or serve locally:
python3 -m http.server 8080
# then visit http://localhost:8080
```

No dependencies, no build tools — pure HTML/CSS/JavaScript.

## License

[MIT](LICENSE)
