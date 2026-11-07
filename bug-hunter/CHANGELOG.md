# Bug Hunter - Changelog

[Game README](./README.md) · [Asset guide](./docs/assets.md) · [Documentation](./docs/) · [Browse assets](./assets/)

This changelog tracks game-version changes starting with v1.12.55. Earlier releases are not reconstructed here.

## 1.16.16 - 2026-11-07

- On call with a friend, you now see them fight:
  - Their health, as a bar over their name (green, yellow under half, red under a quarter).
  - Their weapons at work: arrows (with their element or fusion), knives, boomerangs, rockets, bricks, drills, durians, balls, molotovs, their lightning, their sword cuts, rings, blasts, strikes and the other effects, and their saws turning round them, with the looks their skills and evolutions give them.
  - Their phone sends it with their place, a few times a second, in a compact form; between messages the shots fly on, the effects fade and the saws keep turning, so it reads smoothly. What comes over the link is checked before it is drawn.

## 1.16.15 - 2026-11-07

- Friends are kept up to date:
  - Each friend's level, masteries and when they were last seen are saved with their name and picture, from what their phone tells us whenever we link (and again after they change name, skin or gear).
  - Opening the friends list calls the saved friends again: whoever is online is linked and their skin, level and gear refreshed on the spot, with the list redrawn in place (it used to jump to the cover). There is no server to ask: an offline friend stays as last seen, with «seen 5 min ago» under the name.
  - On a phone the row's play button is narrower, so a name is no longer cut short.

## 1.16.14 - 2026-11-07

- Scanning a QR where the live camera cannot be opened (an iPhone's home-screen app often gives pages none):
  - The reader stays open and says what went wrong (the error's name), instead of going back with «no camera».
  - A new «Take a photo of the QR» opens the phone's own camera; the QR is read out of the photo (tried at several sizes), and the game joined.
  - When the back camera cannot be chosen by name, any camera is tried before giving up.

## 1.16.13 - 2026-11-07

- A run or a Siege battle is no longer lost when the browser throws the page away (an iPhone short of memory, or the game left in the background a while, loads it again from the start):
  - The run under way (Sprints, Guard, Nightmare, Boss Rush, the secret shift) and the Siege Cartoon battle under way are kept every few seconds and the moment the page is hidden.
  - On opening the game, or the Siege, again, a dialog offers to carry on where it was (or to start over). Quitting a run or a battle yourself drops the kept copy; so does finishing it.
  - Not kept: runs played with a friend (their link is gone with the page), the board, and duels.
- The Siege lets go of the pictures of other battles' troops and other worlds' battlefields when a battle starts: the whole Siege's pictures would take over 500 MB decoded, and an iPhone reloads a page past its share of memory.

## 1.16.12 - 2026-11-07

- The Bell Ringer lying dead: its body (hands and feet) now rests on the ground line like every other troop's, with the bone thrown in front of it lower, nearer to us.

## 1.16.11 - 2026-11-07

- The Bell Ringer, the Crowned Wraith and the King's Jailer are now rare champions:
  - They are drawn bigger and have more than double their life and strength:
    - the Jailer: 2800 life, 75 damage, a longer chain;
    - the Bell Ringer: 2300 life, a longer toll that stuns for longer;
    - the Wraith: 950 life, a scream that reaches further and slows for longer.
  - The Jailer and the Bell Ringer cannot be thrown back.
  - They no longer come in the usual waves. From 40 seconds in, one arrives every fifth wave, never two at once, taking turns, with a roar and a larger arrival: about four in a five-minute battle.
  - In the Villain campaign their cards cost more to match.
- The toll and the scream move:
  - Their red rings are cut out of the attack poses and leave the bell's mouth or the Wraith's mouth.
  - They run out across the reach of the blow, growing and fading.
- Falls:
  - A flyer killed in the air now falls from where it flew to the ground, instead of appearing on the ground at once.
  - Its crash dust comes when it lands.
  - The Bell Ringer lies on its body when dead: it no longer floats on the bone drawn in front of it.

## 1.16.10 - 2026-11-07

- The King of Darkness always shows his new art. His redraw kept 22 of the 24 file names, so browsers that had the old pictures could go on showing them for days, mixed with the new ones. His pictures' addresses now carry a revision (`ART_REV` in the Siege Cartoon view), and every player fetches the new art at once.

## 1.16.9 - 2026-11-07

- Moving your game: Options has a new «Move my game». «Copy my game» puts the whole saved game (runs, Siege and Villain) in one short packed code; «Load this game» on the other side reads it, shows whose game it is (name, coins, worlds open) and, once confirmed, puts it in place of that device's game. It is meant for the iPhone, where the game added to the home screen and Safari keep separate games, and also works between browsers and phones. A code that is not a game, or was cut short, is turned away; if the phone will not copy, the code is shown selected to copy by hand.

## 1.16.8 - 2026-11-07

- Joining a friend by QR, inside the game:
  - «Make a game» shows the game's code as a QR as well.
  - A new «Scan QR» button in «Play with someone» opens the camera and joins the game it reads.
  - No link is needed, so on an iPhone the game added to the home screen (whose saved game is its own, apart from Safari's) is the one that joins.
  - A phone's own camera app reading the QR opens the game and joins too (in the browser).
  - The reader (`jsqr`) loads only when the camera opens; the QR is drawn with `qrcode-generator`.

## 1.16.7 - 2026-11-07

- Playing with a friend:
  - On call (Guard), if the friend who invited leaves the shift or the link falls, the bugs no longer stand frozen on the other phone: after six seconds without them it makes its own and carries on alone, with a notice.
  - The phones now try more ways to reach each other (more STUN servers, and an optional relay of our own set at build time with `VITE_TURN_URL`, `VITE_TURN_USER` and `VITE_TURN_PASS`) before PeerJS's free relay.
  - When the code is right but the two phones cannot reach each other (often both on mobile data), the message now says so and suggests the same Wi-Fi, instead of saying there is no game with that code.

## 1.16.6 - 2026-11-07

- Two new enemies with the owner's art, attacking with sound:
  - the Bell Ringer (world 4, land): a hunched skeleton with a huge bell on its back; its toll strikes our walkers in front of it and stuns them for a moment (not flyers, guardians or the steady);
  - the Crowned Wraith (world 5, air): a floating cloak with a crown and bone claws; its scream runs through everything in front of it, walkers and flyers, and slows them for a few seconds.
- In the Villain campaign each is a card of its own, in its tab.

## 1.16.5 - 2026-11-07

- The King of Darkness has about seven times his life in the last battle (560 → 4000 before the guardians' bonus), a long final fight; as the Villain's card he keeps the life the other guardians have.

## 1.16.4 - 2026-11-07

- The King of Darkness has the owner's new art, in darker bone, black and blood-red colours that suit the last world: his flying throne with its poses for the orb, the eye ray, the skulls and the portal, his throne breaking, and on foot his walk, fist slam, bone spikes, pulse, a fall and his own death pose. On foot he has a fourth attack: a great sweep of his sword that strikes everything ahead and throws it back (taken between his other attacks); he no longer just tips over when he dies.

## 1.16.3 - 2026-11-07

- Turning the music off or on from any settings (the game's, Siege's mute or a volume taken to zero and back) starts the song again from its beginning; moving the volume otherwise leaves it playing on.

## 1.16.2 - 2026-11-06

- The Villain's claw button greys as its charge is spent and fills with colour again from the bottom as it reloads, as the hero's crossbow button does.

## 1.16.1 - 2026-11-06

- The King's Jailer is drawn half as big again, a giant among the enemy.

## 1.16.0 - 2026-11-06

- Version 1.16: Siege Cartoon's Villain update. It gathers 1.15.193–1.15.200: the Villain campaign (the enemy's troops in eight lines and the guardians as cards against our heroes, its own screen, music, mana monument, red bar, and the Eye of Darkness with hands from the ground), Hero against Villain duels between two players, the King of Darkness and the King's Jailer. No gameplay change in this release itself.

## 1.15.200 - 2026-11-06

- New enemy in world 6, the King's Jailer (the owner's design): a hunched giant with no mouth and a cage of ribs full of red souls on its back; it throws its chain from afar, hooks one of ours and drags it to its feet (never past it). In the Villain campaign it is the armoured line's fourth level.
- A hook (the weary reaper's too) drags what it catches at most to just in front of it.

## 1.15.199 - 2026-11-05

- The Villain has no crossbow: the Eye of Darkness sits in its fortress's turret (bone, iron, black-gold or shadow, by the Bow level) and flashes as it sends each volley, and instead of arrows hands burst out of the ground where they would land (skeletal, fire-clawed, a giant demon claw, shadow hands with a skull), grabbing and sinking back; its bar button is a red ball with a claw. Same aim, damage and reload as the crossbow.

## 1.15.198 - 2026-11-05

- The Villain's battle bar is red: its L and A tabs, gems, banners and trims (the owner's bar recoloured), and its card slots red instead of blue, in battle and in the shop's army bar.

## 1.15.197 - 2026-11-05

- The Villain's mana monument is black stone with blood-red crystals and a red glow (in its campaign and in duels).

## 1.15.196 - 2026-11-05

- Siege Cartoon duels, Hero against Villain with a friend (a Duel button on the map): one makes a room and passes on its four-letter code and picks the side, the other types the code and plays the other side; each plays with its own army, levels and upgrades, sees its own fortress on the left (the field turned round for the Villain), and the first fortress down loses (after six minutes, the one with more health left). No crossbow or powers in a duel, a guardian card once each; 120 gold for a win, 40 for a loss. Both players need the same version. On a narrow screen the map's Duel and Villain switches show their icons only.

## 1.15.195 - 2026-11-05

- The Villain campaign has its own music: its menus a creeping C minor in half-time with a music box, whispers and the choir; its battles a C harmonic minor march on techstep with a driven bass and a low brass theme with the tritone in it, the choir at every peak.

## 1.15.194 - 2026-11-05

- The Villain's troops come in eight lines that level up like ours, each level another enemy troop opened in the act it first comes in: skeletons (swordsman, spearman, reaper, spider spearman), fast beasts (undead turkey, war dog, tiger, terror bird), heavy beasts (bear, Rex Head, rhinoceratops, mammothsaurus), armoured (hammer, axeman, gatling robot), shooters (gunner, horned archer, inter-galactic shooter), dark artillery (spike blaster, wizard, fire dragon), fast wings (eagle, ninja bat, pterodactyl, green ninja bat) and dark wings (hypnotist bat, death angel, devil army, red dragon rider); the guardians stay single cards. An older Villain save keeps what it bought as levels of its lines. The heroes are a little stronger to match (simulated again).

## 1.15.193 - 2026-11-05

- Siege Cartoon's Villain campaign, opened by winning the last battle (a Villain switch on the map):
  - its own save and shop: the enemy's troops (each with an energy cost by its strength and a gold price), opened act by act, and the six guardians as cards (each once its act's last battle is won; one a battle, as a guardian; the King of Darkness keeps both his forms);
  - the screen turned round: the dark fortress is ours on the left, our castle the one to take on the right, the world mirrored so the corrupt side is ours;
  - our heroes come in waves at the forms their act reaches, and each act's last battle ends with a hero guardian (heavy armour, blaster, archangel, golem, dragon, star eater);
  - no story in it; balanced with simulations (a moderately upgraded Villain wins every battle but the guardians' without the crossbow, powers or guardian cards).

## 1.15.192 - 2026-11-05

- Siege Cartoon: the world's drifting leaves, snow, embers and birds are drawn in the background (behind the fortresses and troops), smaller and fainter.
- On the map, a double tap on a stage starts its battle straight away (no need to press Start).

## 1.15.191 - 2026-11-05

- Siege Cartoon's final guardian is the King of Darkness (the owner's skeletal king, replacing the Giant King Dinosaur Brute):
  - on his flying throne he takes four attacks in turn: a dark orb, a ray from his eyes through everything ahead, three flaming skulls at the three nearest, and a portal that calls two of his troops;
  - at half his life his throne breaks and he falls to the ground (a crash that throws ours back), then fights on foot with the life he has left: a sword slam all round him, bone spikes bursting ahead (walkers stunned) and a dark pulse that throws everything back;
  - every attack has its own wind-up and strike poses; his half-life line now speaks of his broken throne.

## 1.15.190 - 2026-11-05

- Siege Cartoon has five more powers, with the owner's icons and animations:
  - Glacial prison (act 3, 1000 gold, 200 energy): ice spires burst round the thickest group of enemies, hurt them and freeze them for about three seconds.
  - Emergency wall (act 3, 900 gold, 180 energy): three great shields rise a step ahead of our foremost troop; the enemy on the ground cannot pass them for six seconds.
  - Time rift (act 5, 1400 gold, 220 energy): for five seconds the enemy inside it walks and strikes at a third of its pace.
  - Dragon flyby (act 6, 2000 gold, 380 energy): a blue dragon crosses the screen breathing cyan fire along the ground, burning walkers and flyers in its path.
  - Reaper's anchor (act 6, 1700 gold, 260 energy): a chained blade lands behind the furthest enemy, hurts them and drags them back towards our army (not the guardians or the steady).

## 1.15.189 - 2026-11-05

- Siege Cartoon's energy rebalanced:
  - a battle holds 200 energy, 80 more for each level of the shop's Mana and 100 for each generator step: 1000 with both at the top; it fills faster with each (8 a second, 3 more per generator step, 0.6 per Mana level); the generator costs 80, 140, 200 and 260;
  - every power costs energy as well as its recharge: arrow rain 60/90/120/160, lightning rain 100/150/220, tsunami 150/230/330, meteors 180/280/420, sanctuary 150, sword of judgement 250, black hole 320 (shown on its card and in the shop);
  - troop prices follow their strength (life × damage, reach): the first forms stay cheap, the last forms cost more (swordsman 5 and spearman 5 320, angel 3 520, heavy robot 4 700) and the legendaries need most of the 1000 (ninja 620–680, dragon 720, golem 780, reaper 860, star eater 900); the catapult, wizard, balloon and shield bearer are cheaper; a card dearer than the energy the player can reach says how much Mana it needs;
  - a troop's recharge still follows its price (capped at 30 seconds).

## 1.15.188 - 2026-11-05

- Siege Cartoon has three new powers, with the owner's icons and animations:
  - Black hole (act 5, 1600 gold): a vortex opens where the enemy on screen is thickest, drags them into its centre for 2.4 seconds (not the guardians or the steady) and bursts.
  - Sword of judgement (act 4, 1300 gold): a huge sword falls on the strongest enemy on screen (a guardian first), stuns and strikes, then stays stuck for four seconds striking all round it.
  - Healing sanctuary (act 2, 700 gold): a ring of green light at the front of our army heals the troops inside it for six seconds.

## 1.15.187 - 2026-11-05

- Siege Cartoon's war horn sounds once, the first time our troops strike the enemy fortress, instead of with every enemy wave.

## 1.15.186 - 2026-11-05

- Siege Cartoon's lightning rain colours: white-yellow lightning, orange-yellow thunder, blue storm of wrath.

## 1.15.185 - 2026-11-05

- Siege Cartoon's lightning rain takes its colours from its icons: yellow lightning, white-gold thunder, the storm of wrath's white-blue electricity.

## 1.15.184 - 2026-11-05

- Siege Cartoon's lightning rain: one colour per form instead of many: blue lightning, magenta thunder, the storm of wrath red.

## 1.15.183 - 2026-11-05

- Siege Cartoon's lightning rain: each bolt has its own colour from its form's palette (yellow, white and cyan; violet, gold, pink and white; the storm of wrath blue, red, white and violet); the burst where a bolt hits the ground is gone; the storm clouds sit at the top of the sky, clear of the field.

## 1.15.182 - 2026-11-05

- Siege Cartoon uses the second batch of the owner's effects:
  - fortresses smoke and burn with the owner's art as they lose health; the enemy fortress collapses in a cloud of dust, throwing out stones, beams and its flag, and leaves a pile of rubble and a crack;
  - our crossbow flashes at the tip with each volley, in its tier's look;
  - powers: red warning rings where rockets and meteors will fall, meteors leave cooling craters, a storm sky with bolts over the screen during the lightning rain, foam bursting along the tsunami's front;
  - the ground: scorch marks where rockets blow up, cracks under the golem's quake and the catapult's rock, dust at the heavy walkers' steps and behind a charging rhino (drawn under the troops);
  - each world's air: drifting leaves, fireflies, sand, snow or embers, and now and then a bird across the sky;
  - moments: the war horn as a new wave comes, the guardian's skull as it arrives, fireworks and confetti on a victory, a breaking shield on a defeat, a gold star on a purchase in the shop, a shine when a card becomes ready, sparkles when the energy fills, a spinning coin as gold comes in and a gold ring under a button press (none with reduced motion).

## 1.15.181 - 2026-11-05

- Siege Cartoon's powers have their own icons (the owner's badges, steel to gold as the form rises): arrow, ice, fire and rocket rain; lightning, thunder and the storm of wrath; tsunami, great tsunami and the frozen mega tsunami; meteors, meteor storm and the apocalypse. They replace the main game's borrowed skill icons in the Special shop tab and the battle's S tab.

## 1.15.180 - 2026-11-05

- Siege Cartoon's battle bar in portrait: each troop fills its card and its energy is a small corner tag (no lightning sign), so the cards show their troops on an upright phone.

## 1.15.179 - 2026-11-05

- Siege Cartoon's shop: the army bar no longer sits under the units' stone frame (and, on a narrow phone, under the picked troop's card); the energy tag on each army card scales with the bar, so the troops show on a phone.

## 1.15.178 - 2026-11-05

- Siege Cartoon uses the owner's new effect sheets (cut from chroma green into `siege/fx/`):
  - every weapon has its own hit (sparks for bullets, splinters for thrown things and blades, a ring for energy, shards for ice, stars for magic, a big comic star for heavy blows and sweeps);
  - frozen troops stand in a block of ice that shatters when the cold wears off; stunned ones have stars and birds circling their heads; elites stand in a gold flame aura; the medic's mending rises in green crosses;
  - machines burst into scrap (gears, bolts, plates) when they fall, the enemy gives up a red soul, flyers crash in a cloud of dust and a fallen foe's loot bursts out;
  - guns throw out casings, launchers smoke, rockets leave puffs behind them and arrows a speed streak; the catapult's rock lands in a dust ring;
  - each troop arrives with a flourish of its kind (a summoning circle, a whirl of wind, a heavy thump, the enemy's red portal).

## 1.15.177 - 2026-11-05

- New art from the owner's effects sheet: the heavy robot's cyan plasma ball flies with its trail, leaves the cannon with a cyan flash and bursts in its own eight-frame cyan plasma explosion; the attack helicopter's black-and-gold rockets are hand-drawn now (sharper, drawn at their old size).

## 1.15.176 - 2026-11-05

- The heavy armed robot's last form fires its big cyan plasma ball from the cannon on its back (in place of the rocket salvo, with a bright blast) and gatling bullets from its arms (35% of its damage on top).
- The attack helicopter's rockets are black and gold (their own art; the other troops' rockets keep theirs).

## 1.15.175 - 2026-11-05

- Siege Cartoon: every troop's shot leaves from its own weapon, measured on its attack pose (the gun's mouth, the bow, the throwing hand, the cannon on the back, the catapult's cup, the helicopter's pods), at its drawn size; troops with two guns take turns.
- The heavy armed robot's second gun deals damage now: gatling bullets from its hands in forms 2 and 3 (a fifth of its damage on top) and, in its last form, a big cyan plasma ball (35% on top).

## 1.15.174 - 2026-11-05

- The heavy armed robot's last form fires its rockets from the cannon on its back and its bullets from the gatlings in its hands.

## 1.15.173 - 2026-11-05

- Siege Cartoon's heavy robots (ours and the enemy's gatling robots) stand firm: no blow, charge or arrow knocks them back.
- The heavy armed robot's last form fires a burst of gatling bullets with each rocket salvo, as its design shows.
- New setting, "No time limit": battles end only when a base falls (remembered on this device; the clock shows ∞). On short screens the options' switches sit two to a row so the whole panel fits.

## 1.15.172 - 2026-11-04

- Siege Cartoon's catapult lobs its rock high under gravity: it flies about a second in a parabola that grows with the distance and strikes where and when it lands (its splash, ground only).

## 1.15.171 - 2026-11-04

### Fixed
- Siege Cartoon's rhinoceratops could get stuck charging in place, a hair short of its target, and never strike again (seen against the spearman): its rush stepped exactly up to its reach and rounding left it just outside. Its charge now lands within a field unit of its reach.

## 1.15.170 - 2026-11-03

### Changed
- Siege Cartoon's crossbow no longer hurts our own troops: its arrows pass over them and strike only the enemy (friendly fire is off for now, `BOW.friendly`).

## 1.15.169 - 2026-11-03

### Changed
- Siege Cartoon is fairer in its last worlds, from simulated runs without the crossbow:
  - A threat's wave weighs a troop's reach as well as its health and blows, and sends at most one troop more than a plain wave: light shooters no longer pile up thirty at a time (the first stage of the Darkness had 26 at once against your 7).
  - The shooters threat sends light shooters (the wizard, the alien shooter), not the gatling robot.
  - The enemy grows a little less tough world by world (+2% a world instead of +3%).
  - Its hint names what works against shooters: a tank in front and area damage (the wizard).

## 1.15.168 - 2026-10-31

### Changed
- «Break to back»'s breakbeat blocks and drop are led by a Spanish breaks mid bass, after Colombo: three detuned saws and a square an octave down, driven hard, through a filter that talks within each note, playing its own riff over a clean sub on the strong beats. It replaces the reese there; the levels stay even across the song.
- «Break to back» is cleaner, after The Prodigy's backbeat: a big dry clap (a tight snap and a short body over the clap) marks two and four in every drum block, and the clutter around it is cut (most ghost snares and stutters, the answering bleeps, the cowbell in the drop, the acid in the drop's first half).

### Fixed
- The music's low-pass opens as the intensity already set says when the sound starts: every song was muffled at 2200 Hz on the cover until a run began.

## 1.15.167 - 2026-10-31

### Changed
- «Break to back» leans towards Deekline's breakstep: a new breakstep block (three times in the song) with a straight funky break, a Miami 808 booming and sliding under every kick, the 808 cowbell (in the drop too), a DJ scratch every four bars and the reese growl joining in the second half; the song drops from 140 to 134 BPM.

## 1.15.166 - 2026-10-31

### Added
- A Halloween sale, from 31 October to 2 November every year: every coin pack at half price (the full price struck through), the Vampiress and El Weso offered together in the coin store, each with 8000 coins at half price, and both skins at half their coins in the skin shop.

### Changed
- The vampire skin is the Server Vampiress ("Vampiresa del Servidor").

## 1.15.165 - 2026-10-31

### Added
- Siege Cartoon: a fifth legendary troop, the Weary Reaper (land, 3500 gold, 220 energy), from the owner's sheet. Hunched and slow, it hurls its chained scythe far ahead (185, the chain's length), strikes hard (260, round its prey too) and drags what it hooks 160 field units towards it. Hidden until the game is won.

## 1.15.164 - 2026-10-31

### Changed
- Siege Cartoon's Star Eater is the enormous one now and the dragon rider smaller beside it: the Star Eater drawn about 40% bigger, the dragon a third smaller, each at a height where its whole body and its health bar stay in the view and its breath or beam lands on the troops.

## 1.15.163 - 2026-10-31

### Changed
- Siege Cartoon's dragon rider breathes with its own poses from the owner's sheet: fire down onto the ground at walkers, level at flyers, the breath drawn in the pose (it replaces the drawn puffs).

## 1.15.162 - 2026-10-31

### Changed
- Siege Cartoon's Star Eater has its own beam poses from the owner's sheet: down at the ground when it fires at walkers (the beam then runs on along the ground as far as it reaches), level when it fires at a flyer.

## 1.15.161 - 2026-10-31

### Added
- Siege Cartoon: a fourth legendary troop, the Star Eater (air, 4500 gold, 280 energy), from the owner's sheet. From far off (320), its cosmic beam strikes everything ahead of it as far as it reaches (190) and bursts into a star at its target, reaching flyers too. Hidden until the game is won, like the others.

## 1.15.160 - 2026-10-31

### Changed
- Siege Cartoon's legendary troops are hidden troops: in the shop they show as «?» (every form, name and stats) until the game is won, with only their lock note. The golem is now the Core Titan.

## 1.15.159 - 2026-10-31

### Added
- Siege Cartoon: a third legendary troop, the golem (land, 4000 gold, 260 energy), from the owner's sheet. Colossal gold and crystal, slow and almost unbreakable (6500 health, never thrown back); every punch sends a shockwave that strikes everything in front (170) and throws it far back. It opens when the game is won, like the dragon and the ninja.

## 1.15.158 - 2026-10-31

### Changed
- Siege Cartoon's level 2 ninja is dark blue again (as in 1.15.156).

## 1.15.157 - 2026-10-31

### Changed
- Siege Cartoon's level 2 ninja is a lighter blue, keeping its dark outlines, gold, fire and red eyes.

## 1.15.156 - 2026-10-31

### Changed
- Siege Cartoon's level 2 ninja keeps the sheet's gold, fire and red eyes; only its black turns dark blue.

## 1.15.155 - 2026-10-31

### Changed
- Siege Cartoon's legendary ninja has three forms: the blue ninja (level 1, back from reserve), the hooded shadow ninja recoloured in blue (level 2, 3000 gold) and the black and gold master ninja (level 3, 6000 gold).

## 1.15.154 - 2026-10-31

### Changed
- Siege Cartoon's legendary troops have no limit: the dragon rider and the ninja can go in the same army.

## 1.15.153 - 2026-10-31

### Changed
- Siege Cartoon's ninja, while unseen, is easier for you to follow: 60% opaque (from 45%) and wrapped in drifting puffs of dark smoke.

## 1.15.152 - 2026-10-31

### Added
- Siege Cartoon's legendary ninja has a second form, the master ninja (5000 gold), from the owner's second sheet: a black and gold ninja with a gold headband and red eyes, tougher (800 health) and quicker, whose blazing double slash (560) kills even the toughest troops.

## 1.15.151 - 2026-10-31

### Changed
- Siege Cartoon's legendary ninja has its own art from the owner's sheet: black and gold, glowing red eyes, wrapped in black smoke, with a blazing double slash; a little bigger than before. The blue ninja's poses are kept in reserve.

## 1.15.150 - 2026-10-31

### Changed
- Siege Cartoon's shop groups our troops: the army first, then **Support** (medic, shield bearer, catapult, bomber balloon) and, last, **Legendary**, each under its own heading and in world order.
- The dragon rider and the ninja are legendary: they open when the game is won (the last battle), only one fits in an army, and they are far stronger.
  - Dragon rider: 4000 health and a fire breath that sweeps 340 field units in front of it, striking everything for 150 and throwing it back; drawn as a cone of fire, with a roar and the flames' roar.
  - Shadow ninja: unseen at all times but in the instant it strikes, when it can be hit; its blow (420) kills almost any troop; a fast slash sound.
- The medic shows its mending: green crosses rising off every troop it heals and a green ring round it, with a soft chime.
- The bomber balloon floats steady and slow instead of bobbing like the other flyers.

## 1.15.149 - 2026-10-30

### Added
- "Play with someone" offers the same share-link button as "Add friend": the link adds you as a friend and calls you, with no code to type.

## 1.15.148 - 2026-10-30

### Changed
- Siege Cartoon's dragon rider is gigantic: more than twice as big, the largest of our troops, bigger than the guardians; it flies lower so it stays inside the view.

## 1.15.147 - 2026-10-30

### Fixed
- Siege Cartoon poses: a troop's own blow now shows before its hurt pose, so the rhinoceratops's charge shows its attack before it stands dazed, and the tiger shows its leap. The hurt pose comes only when a troop is thrown back, stunned, or takes a heavy blow (8% of its health or more), at most once every 1.2 seconds, instead of on every arrow and scratch.

## 1.15.146 - 2026-10-30

### Added
- Siege Cartoon: six new troops of ours, from the owner's sheets.
  - Medic (world 2, 400 gold): does not fight; heals every troop of ours around it.
  - Shield bearer (world 3, 500): a wall, very tough and never thrown back; its bash shoves enemies back.
  - Catapult (world 4, 900): throws rocks from far behind onto an area, twice as hard on the fortress; a rune catapult at level 2 (1600).
  - Bomber balloon (world 4, 800): floats over the troops and bombs only the fortress.
  - Ninja (world 5, 1100): unseen for 3 seconds after it is sent, fast double blades.
  - Dragon rider (world 6, 3000): the dearest card, very tough, breathing fire over everything in front of it.
- The other versions of the sheets (the dragon with its breath apart, a second shield bearer, the catapults with trails) are kept in reserve.

## 1.15.145 - 2026-10-30

### Changed
- Siege Cartoon's rhinoceratops charges: from a little way off it rushes its target at four times its pace, throws it back and stands dazed a moment, open to a counterblow.
- The mammothsaurus sweeps with its tusks: every one of our troops in front of it is struck and thrown far back (210 field units).

## 1.15.144 - 2026-10-30

### Added
- Siege Cartoon: eleven new enemy troops from the owner's sheets of Cartoon Wars 2's roster, mostly for the last two worlds, which were short of them.
  - World 2: a horned archer firing red arrows. World 3: an undead turkey.
  - World 5 (the mountains): Rex Head, the terror bird (fast), the rhinoceratops (tough) and its first flyer, a pterodactyl with a skull rider.
  - World 6 (the Darkness): the alien shooter (a red ray that reaches flyers), the mammothsaurus (huge, slow, unshakeable), the spider spearman, and two flyers, the green ninja bat and the devil army.
- The plasma-ball version of the alien shooter is kept in reserve (`assets/old/special/siege/reserve`).

## 1.15.143 - 2026-10-30

### Changed
- Siege Cartoon's tiger: the bound back is the same leap as the pounce (as high, as far, as long), so it lands where it started and gains no ground while it fights.

## 1.15.142 - 2026-10-30

### Changed
- Siege Cartoon's enemy tiger pounces: it leaps in an arc onto its prey, strikes as it lands, then bounds back facing away and turns round to come again.

## 1.15.141 - 2026-10-30

### Changed
- Siege Cartoon shop and army lists go world by world, top to bottom: in the air the drill now sits with the armed fighter (world 3) before the helicopter, and the flying mech (world 5) before the angels, which come last.

## 1.15.140 - 2026-10-30

### Changed
- Siege Cartoon beams (the ray gun's, the mech's, the archangel's, the air magician's) are drawn under the troops, so a shooter stands over its own ray.
- A Spanish story line: "No me queda ya ni bocata, tsss…".

## 1.15.139 - 2026-10-30

### Changed
- Siege Cartoon drill aircraft, reined in: its rush stops short of where its target lands (six tenths of the throw), it strikes less often (every 1.2 s, the gold one every 0.9 s), and a flyer down at striking height can be hit by the walkers. Alone it now falls to five swordsmen, four spearmen or three gunners; the gold one still beats them.
- The fortress quiver refills a little slower (10 a second at the first level, from 12).

## 1.15.138 - 2026-10-30

### Changed
- Siege Cartoon's Spanish story: the sandwich is a chorizo sandwich ("bocata de chorizo") in its five lines.

## 1.15.137 - 2026-10-30

### Changed
- Siege Cartoon gold drill (level 2): its scoop takes the two nearest enemies in reach at once, where the first drill takes one.

## 1.15.136 - 2026-10-30

### Changed
- Siege Cartoon's story: the running joke is a cake now, not a cheese, in all seven lines it runs through, in both languages.

## 1.15.135 - 2026-10-30

### Changed
- The drill aircraft rushes forward with its blow again, the whole way its target is driven back, and still stays low a moment after.
- The cover's word of Siege Cartoon says "bring down the Darkness", not the fortress.

## 1.15.134 - 2026-10-30

### Added
- The cover announces Siege Cartoon once, on its papyrus with the mode's own buttons: "Try it" opens the siege, "Later" puts it away. It waits until the guide's first-visit note is done.

## 1.15.133 - 2026-10-30

### Fixed
- Siege Cartoon tilt: iPhones are now asked for the motion on any tap in the battle (a card, the stick or the field), not only a touch of the field, and again from the settings button; the settings say when the browser refused. The lean is read from gravity itself (`devicemotion`), so it works held flat or upright.

## 1.15.132 - 2026-10-30

### Changed
- Siege Cartoon arrows button: while the quiver empties, the shooting arrow keeps moving across the whole ball; the emptied part shows it in grey.

## 1.15.131 - 2026-10-30

### Added
- Siege Cartoon on a phone: leaning the phone left or right slides the camera over the field, from where it was held when the battle began. On iPhones the first touch of a battle asks for it. It can be turned off in the settings.

### Changed
- The drill aircraft's scoop throws its target back (90 field units, 110 as the gold drill) and follows through only a little, then stays low about a second, open to the walkers, before it climbs away.

## 1.15.130 - 2026-10-30

### Changed
- Siege Cartoon drill aircraft: its blow is a scoop. It dives to its target, strikes once it is down, drags the target 90 field units forward with it (110 as the gold drill) and climbs away, then comes round for the next.

## 1.15.129 - 2026-10-29

### Changed
- Siege Cartoon far view: the ground line sits at 70% of the view (about a fifth up from the foot), and the stage's picture is drawn whole across the view and stretched down to it, never cropped at the sides.

## 1.15.128 - 2026-10-29

### Changed
- Siege Cartoon far view: the mouse wheel walks the arrows' spot (up: further) since the whole field is on screen; the ground line sits a little lower (54% of the view), so the picture is cropped a touch at the sides where it has to be.

## 1.15.127 - 2026-10-29

### Changed
- Siege Cartoon far view: the stage's whole picture shows across the view, nothing cut at the sides; the ground line comes up to the picture's walking line and the ground fills the rest below.

## 1.15.126 - 2026-10-29

### Added
- Siege Cartoon on a computer: the mouse wheel slides the camera over the field in the close-up view; Space starts and stops the arrows; ↑ and ↓ move their spot (held, they keep moving).

### Changed
- The view setting reads "Close up / Far".

## 1.15.125 - 2026-10-29

### Added
- Siege Cartoon settings: a "Mute all" button under the volume sliders; pressing it again brings the sound back as it was.

## 1.15.124 - 2026-10-29

### Added
- Siege Cartoon settings on a wide screen with a mouse: a "View" choice between close up (as before) and the whole field, with both fortresses on screen at once, and a full-screen button where the browser allows it. The whole-field view fills the sky with the stage's picture, as the phone view does.

## 1.15.123 - 2026-10-29

### Changed
- Siege Cartoon guardian stages (each world's last) last ten minutes instead of five: the fortress has to fall and then the guardian. The other stages keep five.

## 1.15.122 - 2026-10-29

### Changed
- Siege Cartoon sky stages send the two toughest enemy flyers unlocked so far rather than the two newest: in the last world that is the death angel and the dragon rider instead of the hypno bat, so the archangel has something to fight for the sky.

## 1.15.121 - 2026-10-29

### Changed
- Siege Cartoon balance, from simulated runs of all thirty stages:
  - The enemy's shooters reach less far: gunner 230 → 185, blaster 210 → 175, wizard 220 → 190. They used to hold a line just outside the fortress bow's reach and beyond our archers', so the shooter stages (7, 14, 18, 26) and the third guardian were stalemates for everyone; now our archers and gunners outrange them and the bow reaches the line.
  - The helicopter flies at 50 instead of 35: it no longer trails the foot troops.

## 1.15.120 - 2026-10-29

### Added
- Siege Cartoon stage threats. Every stage throws one kind of trouble at you most, and it has a counter:
  - Swarm: fast close fighters (counter: area damage).
  - Wall: tough fighters that cannot reach the air (flyers, or shooters).
  - Sky: flyers (troops that reach the air).
  - Shooters: long-range troops (a tank, or fast troops).
  - Giants: the toughest (heavy damage).

  About two troops in three come from the threat, and each wave keeps the strength of a plain one: giants come fewer, a swarm more. The guardian's stage and a few mixed stages keep the usual mix. The map's Start panel names the threat and its counter; when the army has nothing that answers it, the line turns red with a "Prepare army" button to the shop.

## 1.15.119 - 2026-10-29

### Changed
- Siege Cartoon: every rocket now blows up where it lands, with the explosion art. That covers the bazooka and rocket pod, the cannon robot, the heavy robot's rockets, the helicopter's rockets and salvos, and the enemy's. Before, only the robots' last forms exploded.

## 1.15.118 - 2026-10-29

### Changed
- Siege Cartoon flyers stay up. Those that shoot (the helicopter, the armed flyer, the mech's guns, the angels' spells) fire down from their own height and no longer drop to 50. Only close fighters (swords, the drill, fists) come down, to a walker's reach (32, was 22) and no lower, where walkers can strike them back.

## 1.15.117 - 2026-10-29

### Changed
- Siege Cartoon balance:
  - The wizard hits much harder: 60, 66 and 95 a blow at levels 1–3 (was 46, 46 and 57), and level 3 costs 170 energy (was 190).
  - Cheaper: the armed flyer at levels 1 and 4 (45 and 120), the ninja (100), the gunner at levels 1 and 4 (40 and 120) and the bazooka at level 1 (75).
  - Dearer: the vulture rider at level 2 (130) and the flying mech at level 6 (260).
- Siege Cartoon recharge: each troop form now recharges a second for every 10 energy it costs, between 2 and 30 seconds, instead of one recharge per troop at every level. The master swordsman, for example, now waits 20 s where it waited 2.

## 1.15.116 - 2026-10-29

### Fixed
- Siege: troops looked pixelated. The canvas no longer lowers its resolution while frames run slow; it is always at the screen's (at most 2× its CSS pixels). The other gains of 1.15.115 stay: in the busy-battle test it runs at about 13.5 frames a second where it ran at 6.6 before them.
- Siege music stuttering in big battles. Troop sounds are capped at about eighteen a second, the same sound at most every 140 ms and none far off screen; there used to be up to four a frame, over two hundred a second. The music, made live on the same audio thread, now schedules most of a second ahead (it was a third), so a busy stretch of frames no longer runs it dry.

## 1.15.115 - 2026-10-29

### Changed
- Siege performance, measured in a busy battle on a phone-sized screen at 2.75× pixel density with the CPU slowed 4×: from 6.6 to about 18 frames a second.
  - The backdrop (sky, landscape, ground) is painted once into its own canvas and copied each frame; it is repainted only when the camera moves or the screen changes.
  - The canvas resolution adapts: it steps down while frames run slow, and back up once they run fast again.
  - Troops and effects off screen are not drawn.
  - A hit troop flashes with a brightened second copy instead of a blur, which cost a lot each frame.
  - The canvas size is measured only when it changes, and the HUD's layout ten times a second, not every frame.
  - The main game's frame loop does nothing while Siege is open; it used to measure its canvas every frame underneath.
- Site caching (`vercel.json`): fingerprinted files under `/assets/` are cached for a year; images under `/images/` for an hour, then served from cache while they refresh in the background, instead of being re-checked on every visit.

## 1.15.114 - 2026-10-29

### Changed
- Siege Cartoon battlefield: the stage backgrounds are reordered so each world grows darker stage by stage. The fifth stage shows the guardian's lair from that world's map: the invaded king's walls, the cannon citadel, the corrupted giant tree, the dark pyramid, the black ice fortress and the throne castle.

## 1.15.113 - 2026-10-29

### Fixed
- Siege Cartoon battlefield on an upright phone: the stage's background is drawn big enough to reach the top of the screen. Above it there used to be a stretched band of its top colours, green or dark stripes on the forest and Darkness stages.

## 1.15.112 - 2026-10-29

### Changed
- Siege Cartoon battlefield: every stage has its own background from the owner's new set (`siege/backgrounds/world-N/`), five per world. Each comes with where its troops walk and its path's back edge, measured on each picture, so troops and castles stand on that picture's path.

## 1.15.111 - 2026-10-29

### Changed
- Siege Cartoon world map: the owner's new map. The six worlds sit on its winding path in their own regions, and the shop stall is back in the bottom-left corner, where nothing is covered now. The old map is kept under `assets/old`.

## 1.15.110 - 2026-10-29

### Changed
- Siege Cartoon battlefield: the camera is back at its distance from before 1.15.90, so troops and castles are their old size again. Worlds 1, 5 and 6 draw their landscape close, its top cut off, as before 1.15.98. Worlds 2, 3 and 4 keep showing it whole from top to bottom (floating islands, castles, the corrupted side).

## 1.15.109 - 2026-10-29

### Fixed
- Siege Cartoon: the bazooka trooper was drawn far smaller than the rest. Ours is now drawn bigger at every level, 56/60/64/70 (was 40/47/51/53), between the swordsman and the heavy knight, and the enemy's at 52 (was 34), the size of its swordsmen and gunners.

## 1.15.108 - 2026-10-29

### Changed
- Siege Cartoon maps: the Start panel moves to the bottom right (under the right thumb) and the shop stall to the bottom left, drawn the other way round so its chest faces inward. On a phone held sideways both corners are smaller (the Start panel drops its first-win prize line) so neither covers a stage. On the world map the stall stands beside the first world.

## 1.15.107 - 2026-10-29

### Changed
- Siege Cartoon battle: the eye under the VS rides a thin see-through line across the bars' width, the line broken where the eye is, with nothing behind the eye.

## 1.15.106 - 2026-10-29

### Fixed
- Siege Cartoon maps on phones with a notch: the map now runs edge to edge, with no dark bands at the sides; its buttons still keep clear of the notch.
- Siege Cartoon shop: the Back button never breaks its arrow onto a line of its own.

## 1.15.105 - 2026-10-29

### Changed
- Siege Cartoon battle: the view marker under the VS is just the eye, with no strip. It slides from the left end, under our castle's icon, with the camera at our castle, to the right end, under the enemy's icon, with the camera at theirs.

## 1.15.104 - 2026-10-29

### Fixed
- Siege battle on touch screens: while one finger holds the aim stick (or the bow), a tap with another finger on the bottom bar works: troop cards, the L/A/S tabs and the specials. A phone sends no click for such a tap, so the bar's buttons now act on that finger's touch-down instead.

## 1.15.103 - 2026-10-29

### Added
- Siege Cartoon battle: under the VS health bars, a faint see-through strip of the whole field marks with an eye the stretch on screen, and follows the camera as it moves.

## 1.15.102 - 2026-10-29

### Changed
- Siege Cartoon flyers' heights by kind. The flyers that are people or creatures (the fighter, the armed flyer, the eagle, the bats, the dragon riders) cruise low again, at 70. The machines in between (the flying mech, the drill) cruise at 98, and the helicopter and the angels (ours and the death angel) at the top, 125.

## 1.15.101 - 2026-10-29

### Changed
- Siege Cartoon flyers cruise higher, each troop at its own height: the drill 90, the fighter and the bat 95, the mech and the guardian dragon 105, the armed flyer and the hypno bat 110-115, the helicopter and the eagle 120, the angel and the red dragon rider 125 (all flyers used to cruise at 70). Gunners drop to 50 to shoot, still out of walkers' reach.
- Siege Cartoon special bar: the missile button is gone. The discharge (lightning) lands where the bow aims, now with its three bolts drawn there, and costs 60 energy (mana); it waits for enough energy as well as its recharge, and shows its cost.
- Siege Cartoon battle bar: a card or special that cannot be used yet (recharging, or not enough energy) turns grey instead of staying blue; only the ones ready to play stay blue.

## 1.15.100 - 2026-10-28

### Changed
- Siege Cartoon battlefield: on wide screens the far landscape is drawn 25% wider (its height still fits the screen), so it slides about five times further as the camera crosses the field (it barely moved since 1.15.98, while the ground raced past).

## 1.15.99 - 2026-10-28

### Changed
- Siege Cartoon base: Bow · power now shows the arrow (or rocket) and Bow · speed the crossbow (they were the other way round).

### Fixed
- Siege Cartoon shop on an upright phone: the red Back button is smaller, at the left of its own row, and no longer runs into the frame's top gem.

## 1.15.98 - 2026-10-28

### Changed
- Siege Cartoon battlefield: on wide screens (desktop, phone held sideways) the far landscape is drawn smaller, so its top meets the top of the screen and the whole picture shows (sun, castles, floating islands), where its top used to be cut off. Troops, castles and the ground keep their size and place.

## 1.15.97 - 2026-10-28

### Changed
- Siege Cartoon battlefield: the field is 2000 long (was 2400), so slow troops do not take too long to cross it.

### Fixed
- Siege Cartoon bow: aimed at its furthest, the crossbow now rises all the way up at every Bow · speed level. Its arc is measured against the bow's own reach, which it is limited to, not the furthest any bow can reach (at level 0 it used to stop about a third of the way up). Arrows keep the same arc as the crossbow.

## 1.15.96 - 2026-10-28

### Changed
- Siege Cartoon battlefield: the ground layer that moves with the troops now covers the whole surface they walk on, from the back edge of the path (measured on each picture) down to the bottom. Its cut never drops below the troops' feet. Between the feet and the path's back edge it follows the outlines, passing under the feet of the rocks, bones and plants standing there so none is cut in two, and its edge fades over a few pixels.

## 1.15.95 - 2026-10-28

### Changed
- Siege Cartoon battlefield: the ground layer (everything from the troops' walking line down to the bottom of the picture) starts 4 pixels higher; the thin fade above it is unchanged.

## 1.15.94 - 2026-10-28

### Changed
- Siege Cartoon battlefield: the ground layer (from the troops' walking line down to the bottom of the picture) now starts at a straight line exactly where the troops walk. Its top fades over a few pixels only, so it never reaches the rocks, ruins and plants standing behind the path. Before, the cut followed the scenery's silhouettes.

## 1.15.93 - 2026-10-28

### Changed
- Siege Cartoon battlefield: the field is 30% longer (1840 → 2400) and the background has two layers.
  - The ground (path and grass) moves with the troops, stretched along the whole field.
  - The far landscape keeps its size and slides slower (parallax), from its left edge at our castle to its right edge at the enemy's.
  - The cut between the two layers is worked out from each picture: it runs along the foot of what stands on the ground (rocks, ruins, bushes, bones) and along the path between them, so nothing is sliced in two. Those things stay whole in the far landscape, and the cut's edge is softened over a few pixels.

## 1.15.92 - 2026-10-28

### Changed
- Siege Cartoon base: upgrades cost much more and climb steeply: 150, 400, 800, 1400 and 2200 gold for levels 1 to 5. A full row is 4950, where it used to be 1500 (100 to 500 a level).

## 1.15.91 - 2026-10-28

### Added
- Siege Cartoon base: a Mana pool upgrade (five levels, after Energy), with the battle's mana crystal as its picture. Each level adds 40 to the mana a battle can hold from the start, 180 → 380 at level 5. The battle's generator still adds its own on top. Its card shows the starting maximum at each level.

## 1.15.90 - 2026-10-28

### Changed
- Siege Cartoon battlefield: the camera stands 15% further back on wide screens (desktop, phone held sideways), so more of the field and its picture show; an upright phone keeps its distance. The field is 15% longer (1600 → 1840), so troops take longer to cross it. The ground line is where it was, and troops still walk on it.
- Siege Cartoon bow: its reach is now a share of the field. It reaches 55% at first and 80% with Bow · speed at level 5 (before, 60% to 68%), so the speed upgrade matters. Bow · speed at its top level shoots much faster: 8.3 shots a second, from 2.4 at first (before, 3.7 at the top).

## 1.15.89 - 2026-10-28

### Changed
- Siege Cartoon base: the Bow is now three upgrades, each with five levels.
  - Bow · power: damage per arrow +12% a level, and more arrows a shot; its look still goes up to the rocket launcher.
  - Bow · speed: shots a second, and how far it reaches. It now reaches 60% of the field at first and 68% at level 5, where it used to always reach 68%.
  - Quiver: +25 shots held and +3 refill a second per level.

  A save with the old Bow keeps its level as both power and speed.
- Siege Cartoon shop: Base tiles show their card like troops: a short name, what the upgrade does, its numbers at that level and the level as stars.
- Siege Cartoon: the rocket launcher's rockets are red, like the launcher (they were blue). The rocket rain power drops those red rockets nose first from the sky, and each one blows up with the explosion art, now bigger.

## 1.15.88 - 2026-10-28

### Fixed
- Siege Cartoon enemies: re-cut the poses that were cut badly from their sheets. The Brute Eater guardian's attack showed only its club and the red slash, its hurt pose showed the attack, and its lying pose showed the hurt one; all three are now right. The Dino guardian's lying pose no longer carries a piece of the Brute Eater. The enemy blaster lost the wizard's horns and flame hanging under its feet, so it now stands on the ground; it is drawn at the same size. The enemy wizard's wind-up has its burning staff again.
- Siege Cartoon story: when a guardian falls, its lying pose sits above the text panel instead of half hidden behind it.

## 1.15.87 - 2026-10-28

### Changed
- Siege Cartoon shop: a card dragged within the army bar onto another card swaps places with it, and one dropped on an empty place moves to the end. The card it would swap with lights up while dragging. The order is kept in the save and is the battle bar's order (troops and special powers alike).

## 1.15.86 - 2026-10-28

### Changed
- Siege Cartoon balance: every troop's levels now step up clearly. Each new form has at least 30% more overall power (health × damage per second) than the one before, and at least 20% more health and 20% more damage per second. The extra power keeps pace with the form's energy cost: forms that cost far more (the master swordsman, the mounted lancer, the ninja, the ghost sniper, the archangel) got much stronger, and none hits less hard per second than the form below it any more.
- Siege Cartoon balance: the gunner's pistol and the wizard's lightning hit a little harder at level 1. The flying mech's later forms (100, 125, 155, 190, 230) and the heavy robot's (240, 290, 350) cost more energy, to match their bigger jumps.
- Siege Cartoon shop: Strength is now damage per second (counting splash), so fast weak shots and slow heavy ones compare fairly. Each stat shows its number beside its stars.

## 1.15.85 - 2026-10-28

### Changed
- Siege Cartoon shop: a new layout. The troop grid is on the left. On the right, a card for the picked tile shows its picture, name and level, four stats as one to five stars (health, strength, attack speed, move speed, each against every form of the army), its description, its price, and Purchase and Equip/Remove buttons. The army sits below on a stretch of the battle bar's wall, as in battle, between the gold and Start.
- Siege Cartoon shop: a tap on a tile now only shows its card. A double tap buys it, or puts it in (or takes it out of) the army if already owned. Dragging an owned tile onto the army bar equips it, and dragging a card off the bar removes it (with a mouse at once, with a finger after a short hold, so swiping still scrolls). A tap on a card in the bar still removes it.

## 1.15.84 - 2026-10-28

### Changed
- Siege Cartoon: the armed flyer (the flying rifleman and its later forms) now shoots ground troops as well as flyers, from high up where walkers cannot reach it.
- Siege Cartoon: every robot hits an area at every level: our cannon robot and flying mech at all their levels, and the enemy's gatling robots and the gatling boss.
- Siege Cartoon: each troop level has its own description in the shop and on the army cards, describing that form's weapon and role.
- Siege Cartoon: the shop's top tabs no longer show a purple box on Special; labels sit in the tab's dark middle, and on phones the row fits without stretching the Back button.

## 1.15.83 - 2026-10-28

### Changed
- Siege Cartoon: a flyer that swoops down low to strike a walker (the enemy's death angel, our fighters, the drill...) can be struck back by any walker while it is down there; up high it is still out of reach of all but the troops that reach the air. Sky-only flyers never come down.

## 1.15.82 - 2026-10-28

### Fixed
- Siege Cartoon hitboxes: an arrow from the fortress now hits a tall enemy on the ground whose head or body its path passes through (as it already did for flyers), not only where it lands; and our troops reach a guardian or a grown enemy by its drawn size (they no longer have to walk inside a big one to strike it).

## 1.15.81 - 2026-10-28

### Changed
- Siege Cartoon: the death cry is much quieter (it was about ten times louder than a blow; now under twice) and more human: the "ouch" trails off into a dying groan, with two slightly detuned voices, a slow uneven waver instead of a buzz, and breath through the same mouth growing as the voice fades.

## 1.15.80 - 2026-10-28

### Changed
- Siege Cartoon story (Spanish): King Álvaro's lines have more swagger: a joker, a good sort and a bit of a show-off, but firm ("¿A morir? Mira, chaval, los he traído a echarte de aquí. Y yo no fallo.").

## 1.15.79 - 2026-10-28

### Changed
- Siege Cartoon story: back to the English telling the owner liked best (the cheese contest, Manolo guarding the cheese and losing it on the Sky Islands), now with sandwiches too for Manolo, and the Spanish is a faithful translation of it. Personalities kept sharp: Captain Jorge serious and laconic, Manolo the joker (the only one with a light Andalusian touch), Felipe the clever one, the King staying home to give orders.

## 1.15.78 - 2026-10-28

### Changed
- Siege Cartoon story: simpler, with sharper personalities: Manolo is the joker (and the only one with Andalusian slang), Captain Jorge the serious, laconic one, Felipe the clever one and the King the one who stays home "to give orders". The cheese gag is gone; the first scene ends on "I'll stay behind a shield. For strategy." — "You go in front. Also for strategy."

## 1.15.77 - 2026-10-28

### Changed
- Siege Cartoon story (Spanish): standard spelling again ("nada", "para", "todo", "-ado", "-ido"; no more "miarma"), keeping the Andalusian expressions ("illo", "quillo", "pisha", "ozú", "qué arte", "ni de coña", "se acabó la bulla").

## 1.15.76 - 2026-10-28

### Changed
- Siege Cartoon story (Spanish): the lines are retold with a street-wise Andalusian, Sevillian sense of humour ("illo", "miarma", "pisha", "ozú", dropped endings like "pa", "tó", "ná", "-ao"); the story, the scenes, the speakers and the cheese gag stay. The English text is unchanged.

## 1.15.75 - 2026-10-28

### Changed
- Siege Cartoon: the death cry is the "ouch!" of 1.15.72 again (the Spanish «¡ay!» of 1.15.73 is undone).

## 1.15.74 - 2026-10-28

### Changed
- Siege Cartoon story: every line rewritten in natural, colloquial Spanish (and its English to match): shorter, punchier, funnier, and no more phrasing that read like a translation. Same story, scenes and speakers.

## 1.15.73 - 2026-10-28

### Changed
- Siege Cartoon: the death cry is a Spanish «¡ay!» (an open "a" closing to an "i", sharp and short) instead of an English-sounding "ouch".

## 1.15.72 - 2026-10-28

### Changed
- Siege Cartoon: a troop's death cry is now a sharp, loud pained "ouch!" (an "ow" that glides from an open to a closed vowel, the pitch snapping up then falling, and a short "ch" of breath), higher for ours and lower and rougher for the enemy's, instead of the soft "aww".

## 1.15.71 - 2026-10-28

### Changed
- Siege Cartoon story: all of it is rewritten around the world names and a running gag (Manolo's cheese, lost on the Sky Islands): the prologue opens on the Meadows, where nothing ever happened, and the king staying home to give orders; each world's scene names its place (the Meadows, the Sky Islands, the Sunken Forest, the Desert of Bones, the Frozen Peaks, the Throne of Darkness); the guardians' lines, the new-in-the-shop line and the ending call back to them. No line says "World One" any more. Spanish and English.

## 1.15.70 - 2026-10-28

### Changed
- Siege Cartoon: every allied troop's attack speed is re-levelled so the strongest forms strike fastest (a faster blow and a lighter one: each form keeps its damage per second). The helicopter now shoots about twice as often (0.9 / 0.7 / 0.5 s instead of 1.8 s), the ninja master throws shuriken extremely fast (0.22 s), the flamethrower, the gatling robots, the uzi gunner, the mech's gatling and the fighters' blades follow, and swordsmen, spearmen, heavy robots and the rest speed up level by level. The archangel's sweep stays slow and heavy.

### Fixed
- Siege Cartoon: the flamethrower's head stays at the same height in every pose (it dropped when it got ready to fire or was hit).
- Siege Cartoon: the sniper (the gunner's last form) is cut properly: its rifle barrel is whole in the ready pose and the neighbouring poses' scraps are gone; and a grey metal part is no longer mistaken for smoke when a sheet's white background is removed.

## 1.15.69 - 2026-10-28

### Changed
- Siege Cartoon: the blaster's level 3 (ray gun) is replaced by the owner's new drawing (white and gold armour, blue helmet and cape, a cyan ray gun).

## 1.15.68 - 2026-10-28

### Fixed
- Siege Cartoon: loose specks (tiny dots floating apart from a pose, not touching the figure or its effect) removed again from the allied troops' poses, now only the ones standing clear of everything else.

## 1.15.67 - 2026-10-28

### Fixed
- Siege Cartoon: the allied troops' sheets were cut from their white background again with a method that keeps the white inside attacks and effects (the flashes, sparks and ray cores that the first cut and the 1.15.66 clean-up had eaten); smoke stays see-through.
- Siege Cartoon: the vulture rider's white pocket under the bird (leftover background between its legs) is gone.

### Changed
- Siege Cartoon: the gunner's levels differ more: level 2 silver-armoured, level 3 black and red (the ornaments recoloured, the blue helmet and cape kept).

## 1.15.66 - 2026-10-28

### Fixed
- Siege Cartoon: the ninja master's hurt pose no longer carries the shuriken left over from its attack, and its hit flash is now the game's gold star (`fx/crit-spark`) like the other hurt poses.
- Siege Cartoon: stray specks (tiny loose dots and sparks left from the sheets) removed from the allied troops' poses.

## 1.15.65 - 2026-10-28

### Changed
- Siege Cartoon: the heavy robot's four forms are redrawn from the owner's new sheet (navy and white armoured walkers with a blue scarf: gatling arms, then rocket pods, then heavy plating, and a cyan cannon on the last); each level is larger than the one before.

## 1.15.64 - 2026-10-28

### Changed
- Siege Cartoon: the wizard's hat and robe are recoloured by level: light blue (level 1), dark blue (level 2) and purple (level 3, as it was); the blue cape, the gold trim and the spell effects keep their colours.

## 1.15.63 - 2026-10-28

### Changed
- Siege Cartoon: the wizard's three forms are back to their earlier art (the 1.15.56 redraw is undone).

## 1.15.62 - 2026-10-28

### Changed
- Siege Cartoon: the archer's levels 1 (rock), 2 (spear) and 3 (bow) are redrawn from the owner's transparent sheet (new hooded outfits with a blue scarf); the ninja master (level 4) stays the masked one.

## 1.15.61 - 2026-10-28

### Changed
- Siege Cartoon: the archer's levels 3 (bow) and 4 (ninja master) are redrawn from the owner's second set of sheets (the ninja with a masked hood and red eyes, a golden-trimmed black outfit and a fan of shuriken).

## 1.15.60 - 2026-10-28

### Added
- Siege Cartoon story: when a guardian falls to half its health the battle pauses for a word from it (shown hurt) and one of ours; and its last words at the end are said from its fallen pose, before the scene of ours.

## 1.15.59 - 2026-10-28

### Added
- Siege Cartoon story: a short exchange (the guardian and one of ours) when a world's guardian joins the battle, as well as the long talk as its stage opens.

### Changed
- Siege Cartoon story: the prologue is retold with the world's calm broken by a smell of sulphur, the corruption and the razed villages, and more jokes (nine lines now).
- Siege Cartoon: every guardian reaches flyers, and its blows throw our flyers back like the troops on the ground.

## 1.15.58 - 2026-10-28

### Changed
- Siege Cartoon: the guardian's talk now plays as the last stage of a world opens, before the fight, instead of pausing the battle when the guardian joins; the scene when it falls stays as it was.

## 1.15.57 - 2026-10-28

### Added
- Siege Cartoon story: a scene when each world's guardian falls (its last words, then ours; after the last one, the ending as before), and the narrator tells what an act opens in the shop at the end of its first stage's scene (acts 2 to 6).

### Changed
- Siege Cartoon: more troops reach flyers from the ground: archers' bow and shuriken forms, the gunner from its rifle on, the blaster's bazooka, rocket pod and ray gun (not its flamethrower), the armed robot's gatling and rockets, the heavy robot's rockets and the wizard's tornado; and the enemy's gunner, blaster, wizard and gatling robot shoot at our flyers too. Close weapons, flames, rocks and javelins still do not.

## 1.15.56 - 2026-10-28

### Changed
- Siege Cartoon: new art for 12 allied troops, every form redrawn on the owner's new sheets: archer (the last form a ninja master), gunner (the last a ghost sniper), blaster (the last a flamethrower trooper), wizard, fighter, armed fighter (the last an air assassin), drill, vulture rider and the flying mech (six forms, the last black and gold). Each form keeps its six poses (walk A, walk B, ready, attack, hurt, defeated), sized so every level is larger than the one before.
- Siege Cartoon: the vulture rider has a second form (dark armour, 1600 gold, tougher and hits harder).

## 1.15.55 - 2026-10-27

### Changed
- Siege Cartoon: the archangel's last form (level 3) is bigger and attacks with a sweeping golden crescent that strikes every enemy up to 230 units ahead and throws them 170 units back (a new sweep attack and a gold crescent picture, recoloured from the level 2 one); it fights closer in (range 120) and a little slower.
- Siege Cartoon: every troop now grows with its level (no level looks smaller than the one before: the archer's level 4, the swordsman's levels 1-3, the mech's first five and others were the same size or smaller); a test keeps it that way.

## 1.15.54 - 2026-10-27

### Changed
- Siege Cartoon balance: our own arrows now hurt our troops at 35% of the damage they do to enemies (it was 100%): a simulated player who kept the bow shooting at a melee scrum wiped its own army and could not win stages 2, 4, 5, 9, 10 and the last two within five minutes; with the lighter friendly fire the same player wins all but a few of the under-levelled attempts on stages 12-14.

### Fixed
- Siege Cartoon: the tallest fortresses (our levels 4-5, the enemy's last looks) are kept under the HUD on short screens, so they no longer run under the energy and health bars.

## 1.15.53 - 2026-10-27

### Changed
- Siege Cartoon's free test mode now also makes the shop's base upgrades free, and gives endless energy in battle (on top of free, open troops and powers).

## 1.15.52 - 2026-10-27

### Changed
- Siege Cartoon: an upgraded power keeps its earlier forms: any form bought (arrow rain, ice arrows, fire arrows, rockets...) can be taken into the kit, up to four, each with its own recharge; buying a new form puts it in the kit if there is room.
- Siege Cartoon: the specials no longer cost energy (the shop's powers, the discharge and the missile are back to recharge only).

### Fixed
- Siege Cartoon: the L / A / S tabs are cut to their hexagons (their pictures were rectangles that showed a stretched square behind the tab when picked).

## 1.15.51 - 2026-10-27

### Changed
- Siege Cartoon: the specials cost energy too: the shop's powers (arrow rain 70, lightning rain 90, tsunami 110, meteor shower 100), the discharge (40) and the missile (30); a special is greyed while there is not enough energy.
- Siege Cartoon: a recharging card or special no longer counts down in seconds: it darkens and lightens from the top down as the wait runs out (its energy cost stays shown).
- Siege Cartoon's shop, Base tab: the army and generator rows have a picture for each of their five levels instead of one for all, and every tile shows its level number.

## 1.15.50 - 2026-10-27

### Fixed
- Siege Cartoon: the battle bar's L / A / S tabs keep the bar's own drawing (no bigger, no gold recolour) and the picked one only glows. A tapped tab no longer stretches over the whole row (its `:hover` rule hid the other tabs on touch screens).

## 1.15.49 - 2026-10-27

### Added
- Siege Cartoon: a new **Special** tab in the shop (between Air and Base) sells powers that cover the stretch of field on screen: **Arrow rain** (arrows, then ice arrows that freeze, fire arrows that leave flames, and rockets that explode), **Lightning rain** (bolts across the field, the later forms more of them and stunning), **Tsunami** (a wall of water sweeping the screen and throwing the enemy back) and **Meteor shower**. Each is bought with gold (an act opens each one) and its forms upgraded like a troop's; three go into the kit, taken in and out with a tap, and appear on the battle bar's S tab beside the generator, the discharge and the missile, each with its own recharge.
- The shop's tabs and buttons fit narrow phones (four tabs, Back on its own row in portrait).

## 1.15.48 - 2026-10-27

### Changed
- Siege Cartoon's shop: every troop's first form always shows (only its later forms hide behind «?»: owning a form reveals the next one).

## 1.15.47 - 2026-10-27

### Fixed
- Siege Cartoon: the enemy fortress is turned to face left, towards ours (and its small picture in the HUD).

## 1.15.46 - 2026-10-27

### Changed
- Siege Cartoon: the enemy fortress has five looks (the owner's new dark castles) instead of three: acts 1, 2 and 3 show the first three, acts 4 and 5 the fourth and the last act the fifth, with the skull.

## 1.15.45 - 2026-10-27

### Fixed
- Siege Cartoon's shop: the text strip under the tiles (name, description, price) no longer runs over the panel's gems, gold rails and centre ornament: the panel is drawn whole at the strip's height and the text stays in its dark inner part (desktop, phones in landscape and in portrait).

## 1.15.44 - 2026-10-27

### Changed
- Siege Cartoon's shop: the troop forms and base upgrades still to come (past the next one to buy) show as «?» instead of their picture and cost, for the surprise.

## 1.15.43 - 2026-10-27

### Changed
- Siege Cartoon: our fortress has five looks, one per workshop level (the owner's new castles, crossbow seated on each one's cannon), instead of four.

## 1.15.42 - 2026-10-27

### Changed
- Siege Cartoon: the battle bar's cards are the stone slots tinted blue through (the stone's texture shows) instead of a plain blue tile.

## 1.15.41 - 2026-10-27

### Fixed
- Music: a busy moment (a screen being built, pictures loading) no longer leaves it stuttering or piling up notes (it is scheduled further ahead and late steps are skipped), and it comes back after the phone was locked or a call on iOS.

### Changed
- Siege Cartoon: a double tap on a shop tile that can be bought buys it.
- Siege Cartoon: the battle bar's cards sit on its stone slots instead of blue tiles, their cost on a dark plate.

## 1.15.40 - 2026-10-27

### Changed
- Siege Cartoon: the fortress's arrows land closer to the aim (less scatter), and they now strike our own troops too, so aim past them.
- Siege Cartoon: both fortresses are drawn taller (about a fifth), kept whole on the field.

## 1.15.39 - 2026-10-27

### Changed
- Siege Cartoon: the battle bar is the owner's new picture with six wall slots (one per deck card); its L/A/S tabs turn gold when picked, and the bow ball plays the owner's three arrow frames while shooting.

## 1.15.38 - 2026-10-27

### Changed
- Siege Cartoon: a troop killed cries a cartoon "aww!" (a higher, sadder one for ours, a lower, rougher groan for the enemy's) instead of the hit sound.

## 1.15.37 - 2026-10-27

### Changed - Siege Cartoon's crossbow
- Its arrows stray a little from the aim, along the field and nearer or further, so a volley lands spread out instead of in one line (and they stay stuck where each fell).
- While it shoots, its button beats with each volley, with a gold ring and arrows flying out of it.

## 1.15.36 - 2026-10-27

### Changed - Siege Cartoon
- A troop killed is thrown back by the blow, up in an arc and hurt, then falls and lies where it lands before fading; the killing blow has its own sound, a heavy muffled hit for ours and a crunchy smack for the enemy's.
- Our crossbow's arrows stay stuck in the ground where they land, at the angle they came in, and fade out after a couple of seconds (the rocket launcher's rockets still blow up).

## 1.15.35 - 2026-10-27

### Fixed
- Siege Cartoon's map on iPhone: the Shop stall no longer flickers (a box flashing behind it while the current spot pulsed); its shadow is part of its picture now.

## 1.15.34 - 2026-10-27

### Changed
- Siege Cartoon: the map's stage panel says just "Start" and is smaller.

## 1.15.33 - 2026-10-27

### Changed
- Siege Cartoon's maps fill the whole screen on phones held sideways and wide monitors (a thin strip cropped at the top and bottom) instead of sitting between blurred bands; squarer screens such as tablets keep the picture whole. On phones the stage panel is narrower so it never covers a stage.

## 1.15.32 - 2026-10-27

### Changed
- Siege Cartoon: the first world's guardian stage is fought on the first battlefield, half clean and half corrupt, where the Darkness reaches the meadows.

## 1.15.31 - 2026-10-27

### Fixed - Siege Cartoon's shop
- Nothing flashes or moves when a troop is bought, equipped or taken out: its pictures come in already trimmed and nothing is animated in it.
- The army's six slots are square, in their own stone frame beside the troops; Purchase greyed out has no box behind it, and no focus box is left after a tap.

## 1.15.30 - 2026-10-27

### Changed - Siege Cartoon's guardians
- Much tougher (4.2 times the troop they come from instead of 2.6, and 70% harder hitting), every blow lands on an area round its target with a blast, and throws back whatever it hits twice as far as a heavy blow (machines and flyers too).
- As a guardian comes out of its fallen fortress, a gust blows our whole army back.

### Changed
- The stage panel on a world's map sits in the same dark stone frame as the pause.

## 1.15.29 - 2026-10-27

### Fixed
- Siege Cartoon's stage panel on a world's map: its text and Launch are centred inside the stone panel, below its top gem and clear of the side ones, and Launch keeps to one line on phones.

## 1.15.28 - 2026-10-27

### Fixed
- Siege Cartoon: troops that throw or shoot show what they fire when they attack the enemy fortress too (rocks, arrows, bullets, rockets with their blast, spells, the wizard's meteors), flying into its wall.

## 1.15.27 - 2026-10-27

### Changed
- Siege Cartoon's map: the Shop stall sits at the bottom right on every map, turned to face the map; a world's Launch panel moves to the bottom left. The map pictures are loaded in advance and buttons no longer flash when tapped on phones.

## 1.15.26 - 2026-10-27

### Changed - Siege Cartoon
- No enemy flyers in the first world: the eagle comes in the second, the ninja bat and the death angel in the third, the hypnotist bat in the fourth and the red dragon rider in the last.
- Our flyers open world by world with them: the aircraft fighter in world 2, the armed aircraft fighter and the drill in world 3, the helicopter in 4, the flying mech in 5 and the angel army in 6.

## 1.15.25 - 2026-10-27

### Fixed
- Siege Cartoon: the map's Shop stall is cut out cleanly (no grass, map specks or ragged edge around it).

## 1.15.24 - 2026-10-27

### Added
- Siege Cartoon's settings open from the map too (the gear beside the gold) as well as from the pause: music and sound volume, the language (Spanish or English, the game's own), and, on the map, a temporary "everything free" switch for testing (remembered on the device) and Reset progress, which asks first and starts Siege Cartoon over.

## 1.15.23 - 2026-10-27

### Changed
- Siege Cartoon's pause, in the UI kit and laid out like the main game's: the round stone pause button; a dark stone panel with the settings at the top left (music and sound volume, the game's own) and close at the top right, then Resume, Restart and Quit as the kit's green, gold and red buttons.

## 1.15.22 - 2026-10-27

### Changed
- Siege Cartoon: explosions are smaller, and the robots' rockets blow up with black smoke while our crossbow's keep the grey.

## 1.15.21 - 2026-10-27

### Changed
- Siege Cartoon: the rockets' explosion is the owner's orange and grey one (fire and smoke) instead of the yellow one.

## 1.15.20 - 2026-10-27

### Changed
- Siege Cartoon: the wizard's meteors come down steeper (about 70°), two at the back and one in front, and leave the fire pool on the ground again instead of the bubbling lava.

## 1.15.19 - 2026-10-27

### Changed
- Siege Cartoon: rockets blow up with the owner's animated explosion, eight frames from a flash to a mushroom cloud to smoke.

## 1.15.18 - 2026-10-27

### Changed
- Siege Cartoon: the wizard's three meteors land spread over the ground and leave bubbling lava instead of fire; they come down from the left at about 45°, their tails on the left.

## 1.15.17 - 2026-10-27

### Fixed
- Siege Cartoon's map and shop no longer flash when a stage, a tile, Purchase or a slot is tapped: the screen is updated in place, its pictures kept, and the shop's list stays where it was scrolled to.
- Three troop poses had a bit of their neighbour in them: the fire paladin's slash, the winged-helmet spearman's walk and wind-up, and the flying sniper's shot.

### Changed - Siege Cartoon's blasts and fire
- The rocket launcher's rockets (the crossbow's last level) blow up where they land, and so do the rockets of the armed robot's and the heavy armed robot's last forms.
- The wizard's last form calls three meteors one after another, turned to fall the way they fly and spread over the ground (one at the back on the left, one on the right, one in front in the middle), each leaving a pool of bubbling lava squashed into an oval for a moment (the game's own lava).

## 1.15.16 - 2026-10-26

### Changed - Siege Cartoon: who can hit whom
- Troops on the ground reach flyers only when their form says so: the master swordsman, the wizard's meteor and the heavy armed robot's last two forms. Archers, gunners, blasters and the rest no longer shoot the air.
- The aircraft fighter and the armed aircraft fighter fight only in the sky (other flyers and the fortress), and so do the enemy's eagle, ninja bat and hypnotist bat; the helicopter, the drill, the angel, the flying mech, the death angel and the dragon riders still swoop on the ground.
- Troops on the ground no longer lean back to aim up.

## 1.15.15 - 2026-10-26

### Fixed
- Siege Cartoon: the sniper (the gunner's last form) walked as two soldiers at once; its poses are cut again, one soldier each, without bits of the next pose. The ninja's hurt pose no longer carries the shuriken it had thrown.

## 1.15.14 - 2026-10-26

### Changed
- Siege opens straight on Siege Cartoon's world map (Siege Legacy is no longer offered; its save stays), with the turn-your-phone notice on an upright phone; Back leaves Siege.
- Siege Cartoon's testing switch is off: troops open by world and cost gold again.
- The cover's last slot is Siege itself, played straight from Play; Fortress is gone from Coming Soon.
- The story scenes and each world's title card stand over that world's own battlefield (the fourth stage's where it has one), and the speakers show a little more above the box.
- A phone held sideways opens the cover on Siege, and shows the cover laid out as on a computer, full width with no scrolling.

## 1.15.13 - 2026-10-26

### Changed - Siege Cartoon's story
- The worlds' names and scenes follow their new battlefields and guardians: The Meadows (the slinger's quarry), The Sky Islands (the gatling robot's factories), The Sunken Forest (the dragons' nest over the swamp), The Desert of Bones (the maw-shaped cave), The Frozen Peaks (the beast under the red ice) and The Throne of Darkness. The story is told by a cast: King Álvaro leads (the crowned giant), Captain Jorge commands the army (the winged spearman), Felipe the Wizard is the clever one and Manolo, the swordsman with the club, the funny one. They talk before each world, answer each guardian when it comes out, and close the ending. Their lines sit on the kit's papyrus panel in white letters outlined in black, the speaker behind it from the waist down; on a heated line the speaker changes pose (winding up, striking or flinching). The guardians speak on a scorched, dark papyrus.

## 1.15.12 - 2026-10-26

### Changed - Siege Cartoon's troops
- New art for all sixteen of our troops, every form and pose, from the owner's sheets: white round faces in blue and gold armour. The swordsman, spearman, archer, heavy armour, gunner, blaster, wizard, armed robot, heavy armed robot, aircraft fighter, armed aircraft, helicopter, drill, angel, flying mech and the vulture rider (now a knight with a spear on a walking vulture, with all six poses). Each keeps its size on the field and its stats.
- New projectiles from the owner's effects sheet: rock, javelin, arrow, shuriken, rockets, spells, and our crossbow's arrows (one per crossbow level, a rocket at the last) and its missile. Bullets and beams are pictures now, each gun its own (pistol, rifle, Uzis, sniper; cyan, blue, gold and pink beams), and new shots for some forms: the frozen cannon's ice, a rocket salvo for the biggest robot and the gunship, plasma for the laser aircraft and the mech, a violet crescent for the angel's staff, the air magician's pink lightning.
- Flyers swoop down on troops on the ground they fight (lower still those that strike in close) and climb again after; troops on the ground lean back to aim up at flyers. Shots leave from, and fly to, the height of whoever fires and is hit.
- Bigger on the field: the helicopter (about 75% taller), the flying mech and the drill (about 30% and 25%) and the angel (15%).
- Four enemy poses that faced the wrong way now face us: the axeman's and the hammer wielder's blows, the eagle and the gatling robot when hurt.
- New art for all eighteen enemy troops, black and red with six poses each (walking, wind-up, blow, hurt, fallen), and the six guardians have their own pictures at last: Large Slinger, Large Gatling Robot, Large Red Dragon Rider, Giant Brute Eater, Giant Dinosaur Brute and Giant King Dinosaur Brute (with the stats of the troops that stood in for them). Each enemy keeps its size and stats.
- Our crossbow's arrows strike the enemy flyers their path crosses on the way, not only what is under the aim where they land.
- Each world has its own battlefield, clean on our side and corrupt on the enemy's: the first world all clean, islands (world 2, with the sky city in its fourth stage), forest (world 3, the swamp in its fourth), desert (4), snow (5), and the last world all corrupt. Those pictures show the corruption themselves, so the dark veil over the field is only drawn on the old one, and the two-layer test in world 2 is gone.
- New maps from the owner's pictures: the world map, the road through the six worlds from clean to corrupt, and each world's own map with its five stages on stone platforms, the fifth before the guardian's lair with its portrait. Tap a world to open its map, a stage to pick it; Back, the gold, the Shop and Launch (with the stage's prize) sit around the picture, which always fits the view. After a battle the world's map comes back.
- The maps and the shop are dressed in the owner's UI kit (carved stone, blue enamel and gold) instead of the paper cards: stone map spots (current, cleared, locked, the guardian's), ribbons with the worlds' names, the gold counter, the tabs, the troop tiles and slots, the info panel and the green, gold, red and grey buttons. In the shop the troops sit inside the kit's big stone panel, dark inside, its corners and gems at their own size. The map's Shop is the owner's market stall with its chest, "Shop" on its board.
- Troop sizes evened out: the gunner, blaster and wizard were drawn bigger than the knights and are now their size, the heavy armed robot is a little smaller, and the swordsman's second and fifth forms no longer shrink after the form before.
- The heavy armour's forms in order: two swords, the armoured one who punches, the maces, and the crowned giant, who is now the King's portrait.

## 1.15.11 - 2026-10-26

### Changed
- Siege Cartoon: troops' shots (bullets, rockets, the archer's arrows, javelins, rocks, shurikens, spells' flights) and the missile fly straight, with no gravity. Our crossbow's arrows keep their flight, nearly straight up close and falling from the sky at the furthest aim.

## 1.15.10 - 2026-10-26

### Changed - Siege Cartoon's music
- Its songs are drum and bass again, epic: an orchestra on top of the drums (strings and horns on each chord, timpani, a cymbal opening each section, the choir at the peaks). The menus play liquid drum and bass in D minor with a heroic horn call; the battles half-time and Amen drum and bass with a war brass theme.
- The guardians have their own song, Nocthrax's wobbling E minor with the orchestra and brass: it starts when the enemy fortress falls and the guardian comes out.

## 1.15.9 - 2026-10-26

### Changed - Siege Cartoon
- Our arrows nudge the enemies they hit back a little (at most once every 0.8 seconds each, never the guardians or the steady), so a volley pushes them without stopping their advance.
- A fallen enemy's bounty flies as orbs from where it fell: a gold one to the gold counter, a blue one to the energy; no numbers.

## 1.15.8 - 2026-10-26

### Added / Changed - Siege Cartoon: worlds, the corrupt wind, bigger enemies, bounties
- Acts are called worlds (World 1-6, five stages each).
- The corrupt wind: once a battle, when the enemy fortress is down to half, a purple gust sweeps from it across the field, blowing our troops back, with a warning and its own howl; the enemy pours out a horde of weak troops and some of its toughest, growing world by world.
- Enemies grow bigger stage by stage (up to 30% at the last battle), as they grow tougher.
- Every fallen enemy gives gold and energy, far more for the strong (a bear about four times a swordsman; a guardian 120 gold and 80 energy), shown rising where it fell.
- Balance, checked with a scripted player over all 30 battles: a steady climb with harder stages at the start of worlds 2, 5 and 6; enemies' stats grow a little less steeply at the end, where battles stalled.

## 1.15.7 - 2026-10-26

### Changed
- Siege Cartoon's music is its own, nothing like Bug Hunter's drum and bass: a synthesised orchestra with trumpet fanfares in thirds, horns, strings, tubas, timpani, a marching snare and cymbals. Its menus play a majestic D major march (92 BPM), its battles a driving D minor charge (138 BPM) with a string ostinato and timpani rolls.

## 1.15.6 - 2026-10-26

### Added - Siege Cartoon: a two-layer battlefield, its own music, and cartoon sounds
- Act 2 is fought on the owner's new two-layer battlefield, to compare it with the single picture of the other acts: the sky behind, fitted to the view's height and scrolling slower than the field, and the ground strip in front, the troops walking on its grass.
- Siege Cartoon has its own music: a bright marimba bounce in its menus (map and shop) and a brass charge in its battles; leaving Siege goes back to the player's pick.
- The troops' sounds are cartoonier: a bonk and a boing for blunt hits, a twanging bow, pew-pew shots, a slide whistle for falling flyers, a spring for broken robots, and a squeaky cry, a pop and a puff of smoke for the fallen.
- The enemy fortress falling is heard (a long crumble, then the guardian's war horn and roar), and a coin chimes when a fat bounty drops.

### Changed (testing)
- For testing, every Siege Cartoon troop is open from the start and recruited and levelled for free (`testing.free` in its model).

## 1.15.5 - 2026-10-26

### Fixed
- Siege Cartoon: the ground below the troops shows the battlefield picture again (its grass, plants and stones) instead of a green blur; where the view runs below the picture, its foreground is stretched to the bottom rather than its last row.
- The archer's four forms are drawn at three quarters, matching the other troops (its sheet is drawn bigger).

## 1.15.4 - 2026-10-26

### Changed / Fixed - Siege Cartoon's battlefield
- Every troop walks on one line (the lanes now only order who is drawn in front), so the card bar never hides one; shots, spells and the aim's landing spot follow.
- The picture's foreground below the walking ground (a huge stone slab at this scale) is covered with its own grass, darkening downwards.
- The card bar sits a little lower: only a few pixels of its rim under the slots show.
- The HUD's gold shows the game's coin picture (the emoji showed as a grey coin on iPhone), and the energy line under the mana is easier to read.

## 1.15.3 - 2026-10-26

### Fixed
- Siege Cartoon: the bow ball can be tapped while another finger holds the aim stick. It answers the moment it is touched (a second finger's tap never became a click); mouse and keyboard still work.

## 1.15.2 - 2026-10-26

### Changed
- Siege Cartoon's far shots fall from the sky: past mid-field the crossbow lifts more and more as the aim goes further, and at the furthest it fires steeply up so the arrows climb out of view and drop steeply onto the spot. Near and middle shots stay hard and nearly straight. Lobbed arrows stay longer in the air, so their fall is seen.

## 1.15.1 - 2026-10-26

### Changed
- Siege Cartoon's crossbow shoots twice as hard: its arrows fly nearly straight, curving down only a little as they go further, instead of being lobbed up and falling.

## 1.15.0 - 2026-10-26

### Changed - Siege Cartoon's crossbow shoots with real physics
- Every shot leaves at one speed under gravity. The crossbow takes the angle that lands it on the aim (the flatter of the two), so it points where the arrows go: straight down at the ground before our wall at the nearest aim, rising as the aim goes further.
- Arrows (and the missile) leave from the crossbow's tip along that angle and fall along a true ballistic path onto their spot, pointing the way they fly; no more drawn arcs or arrows raining from off screen. The aim ring stays as the guide of where they land.

## 1.14.99 - 2026-10-26

### Fixed
- Siege Cartoon: enemies attacked facing away from us. Their sheets draw the attack pose facing right while the other poses face left, so turned round to march at us the attack faced backwards; the eighteen enemy attack pictures are mirrored to match.

## 1.14.98 - 2026-10-26

### Fixed / Changed
- Siege Cartoon: falling arrows (and rockets and thrown projectiles) kept their path's slope to the end; on their last frames they lay flat.
- The card bar sits lower, its bottom rim under the screen's edge.

## 1.14.97 - 2026-10-26

### Changed - Siege Cartoon's crossbow
- The crossbow turns steadily with the aim stick: aimed nearest it points down at the ground before our wall, aimed furthest it points high up; stick up, crossbow up.
- The bow shoots steadily: always the same speed and the same number of arrows per volley (no more speeding up the longer it shoots). Only the shop's Bow level changes it: its look, the arrows per volley (one per look, four rockets at the last) and how often it fires.
- A quiver lasts about twice as long (each volley takes half as much).
- The bow ball loses its orange from the top as the quiver empties (that part of the picture turns grey), and refills as it recharges.

## 1.14.96 - 2026-10-26

### Changed
- Siege Cartoon's battle bar is the owner's picture exactly as drawn: whole, uncut, with its own seven slots and no copies added, centred at the foot of the screen; the cards sit on its slots. The aim stick is smaller on an upright phone, where the bigger one covered the castle.

## 1.14.95 - 2026-10-26

### Fixed
- Siege Cartoon: tapping or clicking the bow ball did nothing, so the crossbow never shot. An older hover/press rule moved the button from under the pointer; it now stays put and the tap starts and stops the arrows.

## 1.14.94 - 2026-10-26

### Changed
- Siege Cartoon's battle bar runs edge to edge again (as in 1.14.91), lower on the screen, its cards on blue tiles; the aim stick is bigger.

## 1.14.93 - 2026-10-26

### Changed / Fixed - Siege Cartoon's battle bar
- The bar holds six card slots, as many as an army takes (the picture's ends and two copied slots), centred, instead of filling the width with empty slots.
- The troop cards sit on blue tiles, so the equipped ones stand out from the empty stone slots.
- No dark strip at the screen's edges on phones with a notch or home bar: the field runs under the safe areas, with the HUD and the aim stick kept clear of them.

## 1.14.92 - 2026-10-26

### Changed
- Siege Cartoon's shop is the whole screen, as in Cartoon Wars 2: no header (back arrow, title, gold) and no Map/Shop tabs above it; a Back button at its top right returns to the map (Escape too), and the gold shows once, at its bottom. It holds still in every orientation; only the troop rows scroll.

## 1.14.91 - 2026-10-26

### Changed
- Siege Cartoon's army takes six land and six air cards (five before); key 6 sends the sixth. The shop's slot column shares its height among the six (two columns of three on short landscape screens). Siege Legacy keeps five.

## 1.14.90 - 2026-10-26

### Changed - Siege Cartoon's shop
- Two or more forms of one troop can be in the army at once (the swordsman at levels 1 and 2, say), each its own card in battle with its own cost and cooldown. An army card is a troop at a level; saves from before keep each equipped troop at the level it had.
- A tap on a form the player has equips it or takes it out (equipped forms carry a green check); the Equip button is gone. Purchase buys the picked form, troop or upgrade. The equipped slots show each card's level, and a tap on one takes it out.
- Map and To battle buttons in the shop's bottom row.
- In landscape the shop holds still, fitting the screen; only the troop rows scroll.

## 1.14.89 - 2026-10-26

### Changed - Siege Cartoon's camera stands further back
- On wide screens the camera stands about 20% further back: the troops, the mana monument and the backdrop look smaller, and more of the field and nearly the whole sky show.
- The fortresses and our crossbow are drawn 30% bigger, so they stand out over the troops (on upright phones, whose camera is unchanged, they are simply bigger).

## 1.14.88 - 2026-10-26

### Changed
- Siege Cartoon's battlefield picture spans the field again on wide screens (as before 1.14.87): fitted to the view's height it was shorter than the field, so the enemy's kingdom showed right beside our fortress. A longer picture (about 5:1) will let the whole sky show at true distances. Tapping the mana monument stays.

## 1.14.87 - 2026-10-26

### Added
- Siege Cartoon: tapping the mana monument raises the generator a level (when there is energy for it), as in Cartoon Wars 2.

### Changed
- Siege Cartoon on wide screens: the battlefield picture fits the view's height, so its whole sky shows (both kingdoms); it scrolls behind the field a little slower than the troops. Upright phones keep the picture as before.

## 1.14.86 - 2026-10-26

### Changed - Siege Cartoon's ground above the card bar
- The card bar sits lower (its bottom rim under the screen's edge), and the troops' ground line rests on the wall's top, so the grass they walk on shows above the bar: lower on a wide screen, and raised on an upright phone, where the castle and troops were hidden behind the bar.

## 1.14.85 - 2026-10-26

### Changed - Siege Cartoon's battle bar runs the full width
- As in Cartoon Wars 2, the card bar spans the screen edge to edge: the owner's picture's left end (L · A · S and the staff) and right end (its wall slots and the bow ball in the corner) as drawn, with copies of its wall slot filling the width between them; the cards sit on the first slots.

## 1.14.84 - 2026-10-26

### Changed - Siege Cartoon's battle shows the whole field
- No dark strips above and below the field: the battlefield fills the screen, the HUD floats over its sky and the card bar over its grass, the troops walking just above the bar.
- The camera slider is gone; the field is still dragged sideways, and the arrow keys still move it.

## 1.14.83 - 2026-10-26

### Changed - Siege Cartoon's bar whole, and Cartoon shots from our crossbow
- The battle bar is the owner's picture whole, as drawn (the L · A · S panel with its staff, the wall with seven card slots, the bow ball in its ring), scaled to the screen and centred; the troop cards sit on its slots, the tabs on its hexes and the bow on its ball.
- Our crossbow shoots Cartoon's arrow (the archer's) instead of Bug Hunter's fire arrow, and the rocket launcher (Bow level 5) shoots Cartoon's rockets; the missile is Cartoon's rocket too.

## 1.14.82 - 2026-10-26

### Changed - Siege Cartoon's aim stick and mana monument
- The aim stick is the owner's: a double arrow as its track and a green orb in a steel ring as its knob, glowing green while held.
- The mana monument uses the owner's clean cut-out (no white fringe left from the earlier JPEG).

## 1.14.81 - 2026-10-26

### Changed - Siege Cartoon's battle bar and mana monument in the owner's art
- The bottom bar is the owner's: the L · A · S hexes (the picked one gold), the golden staff, the troop cards on the stone wall's slots (empty slots show along the rest of the wall), and the bow ball in its spiked ring, darkening from the top as the quiver empties.
- The mana in mid-field is the owner's winged crystal monument, glowing brighter as the energy fills and pulsing when full.
- Siege Legacy's bar and mana are unchanged.

## 1.14.80 - 2026-10-26

### Added - The last three Siege Cartoon air troops on six-pose sheets, and the flying mech
- The owner's sheets for the armed helicopter (3 forms: one rocket, a pair, a salvo), the drill aircraft (2 forms, a drill rocket that rams) and the angel army (3 forms: axe and shield, a violet crescent, the golden archangel's beam) replace their old three-pose pictures, each with its own stats, price, shot and sound.
- The six-form flying machine added in 1.14.77 as the drill aircraft is its own air troop now, the **flying mech** (recruited for 1,200 gold from act 5); every Siege Cartoon ally has its six-pose sheet. An army still takes five air troops.
- Troop levels are saved by troop id, so a troop listed after the enemy's keeps its level.

## 1.14.79 - 2026-10-26

### Changed - Siege Cartoon's castle and crossbow in four levels
- The owner's new castles and crossbows replace the three-level ones: four castles, growing from a small keep to a winged fortress with an eagle, each with a round turret on its right where the crossbow sits; and three crossbows and a rocket launcher, each one picture turning on its wheel (no separate base any more).
- The workshop's Fortress and Bow levels pick the look: 0-1, 2-3, 4 and 5. The shop's Base tab shows each level's look.

## 1.14.78 - 2026-10-26

### Added - The armed aircraft fighter on its six-pose sheet
- The owner's sheet for the armed aircraft fighter (air) replaces its old three-pose pictures: rifleman, veteran sniper, laser gun and air magician, each with fly A and B, ready, attack, hurt and defeated poses.
- Each form has its own stats, price, shot and sound: rifle bullets, long-reach sniper shots, a laser beam, and the magician's lightning striking an area.

## 1.14.77 - 2026-10-26

### Added - Four Siege Cartoon troops on six-pose sheets
- The owner's sheets for the armed robot (3 forms), the heavy armed robot (4), the aircraft fighter (4, air) and the drill aircraft (6, air) replace their old three-pose pictures, each form with walk or fly A and B, ready, attack, hurt and defeated poses.
- Each form has its own stats, price, shot and sound: the robot's rocket, twin-cannon bullets and missiles; the heavy robot's bursts, rockets, frozen cannon (reaching flyers from level 3) and rocket salvos; the fighter's sword; the drill aircraft's rocket fist, laser and plasma beams, ice burst, gatling and giant fist. The shop shows every form as a tile.

## 1.14.76 - 2026-10-26

### Changed - Siege Cartoon's shop, laid out like Cartoon Wars 2's
- Siege Cartoon's Army and Workshop tabs become one Shop, Cartoon Wars 2-style: Land, Air and Base tabs; a row of joined tiles per troop, one for each of its forms with its energy cost (owned bright, the next one to buy darker, the rest locked) and one per base upgrade (army, fortress, energy, bow) with its five levels; the equipped troops in five slots on the right (below on phones); and under them the picked tile's bar (name, level, role, price or why it is locked), the gold, Purchase and Equip/Unequip.
- Siege Legacy's army and workshop are unchanged.

## 1.14.75 - 2026-10-26

### Changed - Siege Cartoon's progression
- Each of the six acts is now fought over five stages (30 battles). The first four are won by bringing down the fortress; the guardian comes in the fifth. An act's title card and story open its first stage, and the map shows each act's stages.
- The army starts with the swordsman alone. The other troops are recruited once with gold (from 100 for the spearman), each from its act on; levels are bought only for recruited troops.
- Every enemy drops gold as it falls (by its toughness, double for a horned one, 60 for a guardian), kept even if the battle is lost; the HUD's gold counts it as it comes. Victory prizes are smaller and grow stage by stage, with half as much again for a guardian; replays pay a third.
- Balance, checked with a scripted player over the whole campaign: the first victory pays enough to recruit a second troop, the second one to recruit another or raise one, and difficulty climbs with walls at the start of acts 5 and 6. The swordsman's second form now costs 120.
- Siege Cartoon's save is now `bugHunter.siege.cartoon.v2`: earlier Cartoon progress (from today's preview) starts over.
- The King appears as the great samurai (the heavy armour's last form).

## 1.14.74 - 2026-10-26

### Changed - Siege Cartoon's story, retold
- The story is now the Darkness, risen in the east to destroy everything, against our King, who marches to push it back fortress by fortress. The King speaks the prologue and the ending (no picture yet); the Wizard speaks on the field; the guardians speak when they join. The acts are now The Border, The Forges, The Red Skies, The Caves, The Ancient Lands and The Throne of Darkness.

### Added
- Each act opens on its title card ("Act N" and its name over the battlefield), the Darkness spreading over it from the last act's to this one's.
- The world grows darker act by act: the battlefield (deeper on the enemy's side, never over the fortresses or troops), the story scenes and the act's card on the map.

## 1.14.73 - 2026-10-26

### Added - Siege Cartoon's story
- Siege Cartoon has its story: the Blue Kingdom, drawn in a notebook's margins, against the Red Ink. A prologue before act 1, a scene before each act, each act's guardian speaking when it joins the battle, and an ending after act 6. Our Wizard speaks for our side (at its workshop level); each act has its own name (The Blank Page, The Gear Workshop, Ash Sky, The Hungry Cave, The Fossil Valley, The Last Page).

### Fixed
- Story scenes cover the whole screen on a scrolled preparation page (phones held sideways), and their Skip button is readable in Siege Cartoon.

## 1.14.72 - 2026-10-26

### Changed - Siege splits into Siege Legacy and Siege Cartoon
- Siege now opens on a mode screen with two modes, each with its own save: **Siege Legacy** (`bugHunter.siege.v1`, the existing save) and **Siege Cartoon** (`bugHunter.siege.cartoon.v1`, new).
- Siege Legacy is back to the first troops (bugs, tickets, legacy code, the Monolith and the other bosses), the nine-world map with its story scenes and guardians, the bridge battlefield with each world's picture, the Town Hall as our fortress and the Tactics bench front as the enemy's.
- Siege Cartoon keeps the new stick-figure troops, their levels and sounds, the green/red battlefield, the tech castle, the crossbow and the enemy hive, now over six acts like Cartoon Wars 2. Each act names its guardian (Large Slinger, Large Gatling Robot, Large Red Dragon Rider, Giant Brute Eater, Giant Dinosaur Brute, Giant King Dinosaur Brute); troops stand in for the pictures that do not exist yet. It has no story scenes until its story is approved.
- Siege Cartoon has its own look outside battle (map of acts, army and workshop in paper and ink).
- The Coming Soon card is called Siege again; the legacy troop names are restored.

## 1.14.71 - 2026-10-26

### Removed - Siege Legacy's tribute note
- The tribute note and credit added in 1.14.70 (map tab, How to play, Coming Soon card) are removed, and the subtitle is back to "Coming soon · Playable preview": the owner did not want them. The mode keeps its name, Siege Legacy.

## 1.14.70 - 2026-10-26

### Changed - Siege becomes Siege Legacy, a Cartoon Wars tribute
- The mode is named Siege Legacy (Asedio Legacy), "a Cartoon Wars tribute". The map tab, How to play and the Coming Soon card tell why it exists: Cartoon Wars 2 was pulled from the stores and can no longer be played, so this mode brings back its battles, troops and rules. A credit line says Cartoon Wars is a Gamevil series and this is a non-commercial fan tribute, not affiliated with them.
- Checked on desktop (1280x720) and phone (390x844): the tribute note fits above the world picker, no sideways scroll.

## 1.14.69 - 2026-10-26

### Added - Siege: every troop's attack and death have their own sound
- Each troop sounds like its weapon when it attacks and like its body when it dies, synthesised to be as close to the real thing as Web Audio allows: a blade's swish and ring, a club's thump, a spear's thrust, claws, a bite, a throw's whoosh, the bow, pistol, rifle, Uzi bursts, the sniper's crack and echo, a gatling's rattle, rocket launches, the ray gun's zap, the flamethrower's roar, thunder, wind, a falling meteor's whistle and blast, a dragon's breath, a drill, magic; deaths are a cry and a fall (lower for brutes), armour clattering, beasts, robots fizzing and blowing up, flyers whistling down and crashing, a horse, a dragon. Levels change the sound with the weapon (club to sword, pistol to sniper, lightning to meteor; the lancer's horse).
- Sounds are louder and centred where the camera looks, softer off screen and panned left or right by their place; the same sound plays at most every 70 ms and no more than four a frame, so a big battle stays a clash of distinct blows.
- The owner's Cartoon Wars 2 upgrade research (bow power, range and speed steps, castle levels, mana, costs per unit form, which units are strong) is kept in `docs/cw2-upgrades.md` as a balance reference.
- Checks: a Siege test covers the sounds of attacks and deaths per weapon, body and level, and the queue's cap (21 tests). Every sound was rendered offline in the browser without errors and none is silent.

## 1.14.68 - 2026-10-26

### Added - Siege: the wizard in three forms, his spells landing on the target
- The owner's sheet (six poses, three forms, as the reference describes, the same staff throughout): lightning, tornado and meteor. Each spell was drawn touching the attack pose's staff: the staff tip is given back to the pose and the spell is cut out on its own, the gap where the staff's ball was filled from its glow.
- Spells land on their target instead of flying to it: the lightning and the tornado stand on it, the meteor comes down from above; all hit an area. From level 3 (meteor) the wizard reaches flyers, as the reference says. Prices 600 and 2000 gold (the reference gives none).

## 1.14.67 - 2026-10-26

### Added - Siege: the blaster in four forms
- The owner's sheet (six poses, four forms, as the reference describes): bazooka, rocket launcher, ray gun and flamethrower. The ray and the flame reached into the next pose in the sheet; figures were told apart from effects by their black stick bodies, and each effect was given to the pose that fires it.
- The bazooka's rocket and the launcher's pair of rockets are cut from their attack poses and fly to the target, blasting an area. The ray gun fires a cyan beam drawn in code; the flamethrower's flame is in its attack pose, with a short reach and a wide area. Prices 350, 600 and 1800 gold (the reference gives none).

## 1.14.66 - 2026-10-26

### Added - Siege: the gunner in four forms
- The owner's sheet (six poses, four forms, as the reference describes): pistol, rifle, two Uzis and the sniper. The sniper's long rifles touched the next poses in the sheet; they were parted by shrinking the figures until they separate and giving each pixel back to the nearest one, so no barrel or cape is cut. Shell casings and flashes go with the attack.
- Gunners fire bullets, a short bright tracer from the muzzle to the target. The Uzis shoot fast; the sniper reaches far, slowly and hard. Prices 300, 500 and 1600 gold (the reference gives none). The sheet is scaled to stand a little taller than the swordsman.

## 1.14.65 - 2026-10-26

### Added - Siege: the heavy armour swordsman in four forms
- The owner's sheet (six poses, four forms, as the reference describes): a knight with two swords, a bigger knight with maces for hands, the samurai who fights with his fists, and a bigger samurai. Cut figure by figure; the big samurai's punch flash goes with his attack. Prices 300, 500 and 1800 gold (the reference gives none); health grows most of all, as he is the line's shield.
- The sheet is drawn larger than the swordsman's, so it is scaled down to stand a little taller than him, the last form clearly bigger.

## 1.14.64 - 2026-10-26

### Fixed - Siege: troops stand on their feet
- Every pose was centred on the troop's place, so a long spear, a cape or an attack's flash pushed the body off it: the shadow sat ahead of or behind the feet, troops seemed to float at its top edge, and the body slid between poses. Each pose is now placed by its feet (the middle of the opaque pixels in its lowest rows, measured once a picture), and the shadow is drawn under them, the feet on its middle. Flyers stay centred.

## 1.14.63 - 2026-10-26

### Fixed - Siege: enemies face our side
- The owner's enemy sheet is drawn facing left, and the game turned every enemy round as if it faced right, so they marched and attacked backwards. Sheets now say which way they face (`facesLeft`, every enemy sheet) and are turned only when needed. The dragon's and the red dragon rider's hurt poses, drawn the other way in the sheet, are flipped to match.

## 1.14.62 - 2026-10-26

### Added - Siege: the archer in four forms, throwing its own projectiles
- The owner's archer sheet (six poses, four forms): rock thrower, javelin thrower, archer with a bow, and the ninja with shurikens. Prices 250, 400 and 1500 gold (the reference gives none).
- The projectile each form throws is cut from its own attack pose (a rock, a javelin, an arrow, a shuriken) and flies in a low arc to its target: rocks and shurikens spin, javelins and arrows point along their path. Troops without a projectile of their own keep the old shot.

## 1.14.61 - 2026-10-26

### Changed - Siege: the swordsman's helmet crest is blue too
- The level 4 swordsman's crest is recoloured to the same blue as his capes (the owner's call), so the first ally wears blue throughout.

## 1.14.60 - 2026-10-26

### Added - Siege: the spearman in five forms; the swordsman in blue
- The owner's spearman sheet (six poses, five forms): basic spear, a longer one, longer still, the horned fox helmet, and the lancer on a white horse, who is only stunned by heavy blows instead of thrown back. Cut figure by figure so each long spear stays with its pose. Prices 250, 400, 600 and 2200 gold (the reference gives none).
- The swordsman wears blue in every form (the owner's call): the red scarf and capes of levels 2, 4 and 5 are recoloured to his level 3 blue, keeping the level 4 crest red and the master's fire slash. The red originals are kept in `assets/old/`.

## 1.14.59 - 2026-10-26

### Added - Siege: troop levels and six-pose sheets, starting with the swordsman
- The owner's swordsman sheet (stick figures, six poses: walk A, walk B, ready, attack, hurt, dead) is in, in five forms: club, dagger, sword and shield, greatsword and the master swordsman (his slash leaves fire and he reaches flyers). The reference's piercing swordsman is dropped, so the master is level 5.
- Troops have levels: the workshop's new Troops rows show each troop with forms at its level and buy the next one (200, 300, 400 and 2000 gold for the swordsman). A form changes the troop's look, stats and energy cost; cards and battles use the level in the save. Old saves start every troop at level 1.
- Six-pose troops alternate their two walking poses as they walk, wind up just before a blow, strike, show the hurt pose, and lie dead where they fell for a moment before fading. Troops with three poses still walk in code, and now tip over when they fall instead of vanishing.
- Checks: Siege tests cover buying levels in order, the save clamp, the level's cost and stats, and the master reaching a flyer that the first form cannot (20 tests).

## 1.14.58 - 2026-10-26

### Changed - Siege: Cartoon Wars 2's armies (test set)
- The owner's first sheets are in: our army is now Cartoon Wars 2's 15 units (10 land: swordsman, spearman, archer, heavy armour, gunner, blaster, wizard, vulture rider, armed robot, heavy robot; 5 air: fighter, armed fighter, helicopter, drill craft, angel army), and the enemy has its own 18 troops (swordsman, spearman, dog, bear, reaper, hammer, axeman, gunner, spike blaster, wizard, tiger, dragon, death angel, eagle, ninja bat, hypnotist bat, red dragon rider, gatling robot), each cut from its three poses (standing, attacking, hurt) with its own alpha. They replace the bugs borrowed from the main game.
- Stats follow the reference's equivalences; enemy troops join world by world (`FOE_LAND`, `FOE_AIR`) and each world's guardian is its toughest troop so far, drawn bigger and glowing red, until there are boss sheets. Enemy troops can never be in our army or be summoned.
- Animated in code: walking (a hop, squash and lean each step), breathing, the strike's lunge, and heavy blows (20% of a troop's health): infantry are thrown back, turned over, and get up; the rest are stunned; the red dragon rider never. Gatling robots break twice into wrecks; about one enemy gunner in four comes horned (elite).
- Old saves keep their progress; their army is checked against the new list and topped up.
- Checks: the Siege tests now cover the new rosters, knock-back, stun and the steady rider (19 tests).

## 1.14.57 - 2026-10-26

### Fixed - Siege: the crossbow points down at a near aim
- Our shots always flew a high arc, so at the nearest aim the crossbow pointed up although the target was below it. The arc now grows with the distance: none at the nearest aim (crossbow, arrows and missile go straight down at it), the full arc halfway to where the arrows rain from the sky. Pointing down, the arm is drawn in front of its base so it shows.

## 1.14.56 - 2026-10-26

### Changed - Siege: one battlefield with its own ground, no bridge
- The owner's panoramic battlefield (`siege/backdrop`): our green side with floating islands on the left, the bugs' red side with the vortex on the right, ground included. It is drawn across the whole field and moves with the troops, its walking ground on their ground line. It replaces each world's map picture behind the field and the bridge over the abyss (the bench pictures are no longer used here).
- The ground line sits lower (70% of the view, 74% on short wide screens). On an upright phone it comes down until the picture reaches the bottom, and the picture's sky colours carry on above it, faded in, with no seam.
- Checked by screenshots at 1280x720, 844x390 and 390x844: troops, fortresses, crossbow and arrows stay in view and stand on the picture's ground.

## 1.14.55 - 2026-10-26

### Added - Siege: our fortress, its crossbow and the enemy fortress
- The owner's three side-on sheets, cut with their own alpha into `assets/special/siege/` (public `/images/game/siege/...`): our tech fortress and the enemy bug fortress in three levels each, and our crossbow's base and arm in three levels.
- One fortress per side for now (world themes later, as skins): ours follows the workshop's Fortress level (0-1, 2-3, 4-5), the enemy's the world (1-3, 4-6, 7-9). They replace the Backlog Town Hall and the Tactics bench front.
- The crossbow stands on our battlement and follows the Bow level; its arm turns towards the aim (steep where the arrows rain from the sky) and kicks back at each shot; the arrows and the missile now leave from it.
- A fortress smokes under 60% health and burns under 30%.
- The workshop's Fortress and Bow rows show the fortress and crossbow your level gives.
- Checked by screenshots at 1280x720, 844x390 and 390x844 (levels 0, 3 and 5; worlds 1, 5 and 9; full and low health): everything stays in view.

## 1.14.54 - 2026-10-26

### Added - Checks for skins and the shop
- `tests/skins.test.mjs` (in `npm run test:game`): the skin groups (every skin in one, specials cheapest first, bosses 1 to 9 then the secret one), the world outfits, every skin's name and line in both languages, every skin's pictures (13 base poses, side walk and aim in fours, back walk in pairs and only for `BACK_WALK_SKINS`), taller pictures listed in `SKIN_TALL`, and the shop's short lines (both languages, shorter than the full text, 72 characters at most).
- `npm run test:game:shop` (after `npm run build`, needs Playwright): opens every shop section with a fresh and an advanced save at 360 px, 430 px and on desktop and fails when a card's content spills out, runs under a lit card's band, its button leaves the band's panel or a row's cards differ in height; also the coins level with the X, the three skin groups, and wearing a skin from the shop. It catches the 1.14.49 two-button bug when it is put back.
- To let the checks read them without a browser, the back-walk skins, the tall skins and the shop's short-line list moved into `save.ts` and `shop.ts` (same values).

### Fixed
- The Spanish fire spirit's short shop line was the same as its full text; it is shorter now (found by the new check).

## 1.14.53 - 2026-10-26

### Fixed - The Server Reaper at full size in the shop and Customise
- The lists fit every skin picture to the same height, and the reaper's picture is taller (168 px against 144) because its scythe rises above its head, so the figure came out smaller. The shop and Customise now draw it 168/144 taller, growing upwards only (feet and name where the others' are), so its body matches the other skins and the scythe sticks out.

## 1.14.52 - 2026-10-26

### Fixed - No slow ring over painted bosses
- A slowed enemy shows a light-blue ring at its hit circle. On a painted boss that circle is far smaller than its picture, so the ring floated over the middle of its body (seen on Nocthrax under the frost). Painted bosses no longer draw it, like the white hit flash they already skip.

## 1.14.51 - 2026-10-26

### Fixed - Nocthrax's rim is a soft glow again
- The performance pass of 1.14.43 had swapped the Core dragon's blurred magenta rim for a hard cached outline, which read as a flat pink blob round it. Its rim is again a soft glow, now blurred once per pose and kept (no shadow blur each frame), so it looks as before and costs as little as the outline.

## 1.14.50 - 2026-10-26

### Changed - The shop's coins on the frame, beside the X
- The shop's coins (and their + button) sit centred on the frame at the height of the X instead of floating over the top-left of the list, so they no longer cover a card's name while scrolling. They are lifted out of the scrolling box like the X (its edge fade clipped anything inside it). Retro keeps them above the title.

## 1.14.49 - 2026-10-26

### Fixed - Shop cards with levels, owned and worn
- Items with levels (the Phoenix cloak, the quiver, the knives, the spirits): the old `bandCards()` sizing, made for the stretched frame, fought the fixed bottom strip and blew the card up with an empty lower panel; it is gone. Only the last button (wear / worn) goes into the strip, the upgrade stays above it in the window (both had been pulled into the strip, the upgrade hidden behind the other).
- Lit cards no longer keep the old 196 px floor on top of the strip, and the level pips are no longer given the description's four-line box: forge and level cards lose their empty gap.
- Checked on phones (360 and 430 px) and desktop with a fresh save and with an advanced one (items owned and worn, levels, maxed forge, arsenal and spirits bought).

## 1.14.48 - 2026-10-25

### Changed - Wider, even shop cards on phones
- Phones: the shop's content comes closer to the frame's stone (side bands 9.5% instead of 13%), so the two columns of cards are about 23 px wider in all.
- Shop cards' lines sit in a box of the same height (three lines, four on phones), so the cards of a window line up. The long arsenal weapons, the spirits and the extra charm get short shop lines of about the same length (the full ones stay on the level-up cards).

## 1.14.47 - 2026-10-25

### Changed - Whole shop two by two on phones; skins worn from the shop; world outfits shown
- Phones: every shop window (forge, armour, weapons, arsenal, spirits, skins) shows two cards per row. Cards there have a thinner frame, smaller texts and a button whose caption may take two lines; their single column no longer grows to the button's width (texts and buttons used to spill out of the card).
- Every lit card that ends in its button keeps the band and lower panel as a fixed strip at the bottom, with the button centred in the panel and the texts above the band, whatever the row's height (a shorter card's button used to rise onto the band, and the band crossed long descriptions).
- Skins: alvrich's world outfits are listed in the shop's World group with their lock (`World N · Sprints`), and an owned skin is worn straight from the shop with a green «Wear» button.

## 1.14.46 - 2026-10-25

### Changed - Skins in three groups; the shop's skins two by two on phones
- Customise and the shop list the skins in the owner's three groups, each under a small gold title: World (alvrich and, in Customise, his folded world outfits), Specials (sold for coins from the start, cheapest first) and Bosses (in the order of the boss that opens each, the secret shift's Spartan last).
- Shop, phones: skins two per row as small cards (figure, name and button; the description is read in Customise). Desktop already showed two per row. A group of one card (alvrich) is centred.

## 1.14.45 - 2026-10-25

### Fixed - Skin texts fit their plates and cards
- Customise, narrow phones: the lock line is shorter (`World N · Sprints`, like `Boss N · Guard`) so it no longer breaks onto the plate's frame; names stay on one line and descriptions on two, so no row writes over its frame. Two long descriptions (Skull King, Mud Mudling) and the Spanish hacker name are shorter.
- Shop: on the lit card (skins you own or can buy) the band and lower panel are now a fixed strip at the bottom instead of stretching with the card, so the description stays in the window above the band and the button sits in the panel. The Spanish "wear it" button reads «Ir a Personalizar» so it fits on one line.

## 1.14.44 - 2026-10-25

### Fixed - The Server Reaper at full size; worn skin centred in Customize
- The Server Reaper was scaled with its scythe counted in its height, so the figure itself came out smaller than alvrich. It is cut again from the owner's sheet with the hood-to-feet height matched to alvrich's (144 px on the front pose), so the scythe now rises above the head instead of shrinking the reaper. The previous cut is kept in `assets/old/shared/hero/reaper-v2/`.
- Customize: the worn row's lit orange plate has its hole further in than the blue one, and the skin (or item) worn was drawn at the blue plate's spot, a few pixels off the ring. It is now centred in it.

## 1.14.43 - 2026-10-25

### Fixed - Smoother long On call runs; small bugs found on the way
- On call slowed down towards the ten-minute mark: the boss trail, every orb, every enemy aura, the rage glow and the final crown each built a fresh radial gradient (and the crown and the chimera a blurred shadow) every frame, particles were never capped and everything off screen was still drawn. Glows are now stamped from small cached sprites, the chimera's rim is a sprite outline, particles are culled off screen and capped (soft 500, hard 800; none off screen in On call), the boss trail is capped at 240 dabs, fires use fewer licks when small.
- The simulation filtered the live enemies anew for every shot, every chain and every count: one list per tick now. Rockets no longer scan the whole field once per enemy. Rooted plants are no longer teleported back with the stragglers.
- Hit sound no longer plays once per frame on a crowd (50 ms spacing), and the music no longer fires a burst of stacked drums after a long frame or a tab switch: missed steps are skipped.
- The friend card no longer measures the HUD every frame; the menu backdrop is no longer drawn under Siege; Siege's bar buttons keep their picture and only change their caption (they used to re-create an `<img>` ten times a second).
- A sprite with back-walk steps is no longer cut before its picture is in (the failure was kept and the steps lost for the run).
- Fixture: the fireball horde check lays the bare room with a fixed field key, so On call cannot put its random racks back and make the check flaky.

## 1.14.42 - 2026-10-25

### Fixed - The hero no longer flips for a frame while walking
- The way the hero faces is held steady: the pose's angle (the target's while shooting, the heading while walking) only turns the figure once it has pointed the other way for 0.12 s. A shot at an enemy behind, the gap between two waves (walking swaps to the aimed walk and back) or a stop between two touches used to mirror the figure for a frame or two. The wings follow the same facing.

## 1.14.41 - 2026-10-25

### Added - World 4's boss skin; three skins sold without a gate
- New boss skin for world 4, the Mud Mudling (10000), opened by beating Medusa in On call: the owner's 20-pose sheet cut with its own alpha (one extra aiming pose dropped), scaled to alvrich's height, with its own back walk.
- El Weso, Medusa and the Server Vampire are now sold for coins from the start, like Kitty (10000 each), and listed beside her; the boss skins keep world order.

## 1.14.40 - 2026-10-25

### Changed - alvrich's world outfits come with sprints wins
- alvrich's world outfits are no longer sold: winning world n in sprints gives world n + 1's outfit and puts it on at once (On call, Battle and the Boss Rush do not count). The intern, world 1's, is everyone's from the start.
- Older saves get every outfit for the sprints worlds they have already won (and the intern) when they load; their coins are not touched. Locked outfits say «Win world n · Sprints», and the shop no longer lists them.

## 1.14.39 - 2026-10-25

### Changed - Boss skins in world order
- In Customise the boss skins are listed in world order, by the On call boss that opens each (El Weso and Kernel Glitch, Hotfix Demon, Frost Shieldmaiden, Medusa, Legacy Bloom, Thunder Heir, Overclock Trooper, Server Reaper and Server Vampire, Core Drake), with the secret shift's Ashen Spartan last.

## 1.14.38 - 2026-10-25

### Changed - Server Reaper redrawn
- The Server Reaper skin is replaced by the owner's redrawn sheet: scythe on his back, a blue lantern, and his shot a burst of ghost skulls from the lantern. Its 19 poses are cut with the sheet's own alpha and scaled to the old pictures' height, with his own back walk (`BACK_WALK`). The first pictures are kept in `assets/old/shared/hero/`.

## 1.14.37 - 2026-10-25

### Added - alvrich walks away with real steps
- alvrich (without a hat) has his own back walk: the owner's two back-walking poses (`boy-base-bwalk-0/1`, poses 4 and 5 of his new sheet) cut with the sheet's alpha and scaled to his back picture, so walking up alternates real steps instead of striding the back picture. His other pictures and the hat versions are unchanged.

## 1.14.36 - 2026-10-25

### Added - Eight boss skins from On call
- Eight new special skins (10000 each), each opened for sale by beating a final boss in On call, like the Server Reaper: Kernel Glitch (boss 1, Kernel Panic), Hotfix Demon (2, the Archdemon), Frost Shieldmaiden (3, the Drakkar), Legacy Bloom (5, the Queen), Thunder Heir (6, Zeus), Overclock Trooper (7, the Mech), Server Vampire (8, the Wraith) and Core Drake (9, Nocthrax).
- Their 19 numbered poses are cut from the owner's transparent sheets with their own alpha (two touching poses on the vampire's sheet split at their thinnest column), scaled to alvrich's height, with their own back walk (`BACK_WALK`).

## 1.14.35 - 2026-10-25

### Added - Six new skins, redrawn, the first with their own back walk
- The owner's six redrawn special skins, now shooting like the hero, on sale from the start at their usual prices: Rubber Duck Trooper (5000), Cardboard Knight (5000), Black-Hat Hacker (8000), Skull King (10000), Potato Gladiator (5000) and Crunch-Time Boss (8000).
- Each sheet's 19 numbered poses are cut with its own alpha (its faint haze under 70 and specks dropped) and scaled to alvrich's height: front, side and back standing; the back walk's two steps (`bwalk-0/1`, the first skins in `BACK_WALK`, so walking up alternates real steps); the front walk's two; the side walk's four; shooting; the aimed walk's four; cheer, hurt and knocked out.

## 1.14.34 - 2026-10-25

### Added - Room for a real walk away from the camera
- A skin can now have its own two back-walking pictures (`hero/<set>-bwalk-0` and `-bwalk-1`: seen from behind, one foot up, then the other). Listed in `BACK_WALK` (`src/draw.ts`), the hero alternates them when walking up, instead of striding the single back picture by warping it. No set has them yet, so nothing changes until the pictures are added.

## 1.14.33 - 2026-10-25

### Changed - The profile's hero opens the character list scrolled into view
- Tapping the hero (its 👕 badge) in the profile opens Customise already scrolled down to «Choose your character», instead of at its top.

## 1.14.32 - 2026-10-25

### Changed - Normal skin prices back; the six new skins removed
- The testing switch is off (`FREE_SKINS = false`): skins have their world and boss gates and their usual prices again.
- The six skins added in 1.14.28 (Rubber Duck Knight, Cardboard Knight, Black-Hat Hacker, Skull King, Potato Gladiator, The Boss) are removed, their pictures and names with them, as their art was not right. A save that bought or wore one (for 0 coins in 1.14.31) drops it and goes back to alvrich.

## 1.14.31 - 2026-10-25

### Changed - Skins on sale for 0 coins, not given away
- With the testing switch (`FREE_SKINS`) on, every skin is open and costs 0 coins, but each must still be bought once to be owned (it is then kept in the save like any purchase); 1.14.30 gave them all to every player without buying. The shop and Customise show «Buy · 🪙 0». Turning the switch off brings back the gates and prices. No paid skin pack or daily skin is offered while it is on.

## 1.14.30 - 2026-10-25

### Changed - Every skin free for testing
- A testing switch (`FREE_SKINS` in `src/save.ts`, the owner's call) makes every skin open and owned, so any can be worn at once: no world or boss gate, no price. Nothing is written to the save (owned skins and coins are untouched), so turning the switch off brings back the gates and prices as they were. While it is on, the shop offers no skin pack or daily skin, and the wardrobe achievements still count only skins really owned.

## 1.14.29 - 2026-10-25

### Fixed - New skins' cuts, alvrich in lower case
- The Boss's running and attacking poses, drawn smaller on the sheet, are scaled to the same head size as his standing ones (about 10% up); a stray speck by the Rubber Duck Knight's walking attack is dropped. The six new skins were checked pose by pose on magenta: clean edges, their effects (papers, cubes, gems, slashes) kept.
- The default skin's name is written «alvrich», and its world outfits' row «alvrich by world».

## 1.14.28 - 2026-10-25

### Added - Six new skins, the profile opens the skins, Alvrich's world outfits fold away
- Six new special skins from the owner's transparent sheet, on sale from the start: Rubber Duck Knight (5000), Cardboard Knight (5000), Black-Hat Hacker (8000), Skull King (10000), Potato Gladiator (5000) and The Boss (8000). Each row's 16–17 poses are cut with the sheet's own alpha (its faint haze under 60 dropped) and laid onto the hero's 21 (front, idle, the walks, the attack with its effect as the shot, hurt, knocked out); the sheet has no back view, so the side idle stands in for it.
- In the profile, tapping the hero (a 👕 badge on it) opens Customise on the character list.
- In the character list, Alvrich's nine world outfits fold under one «Alvrich by world» row with how many are owned; it opens by itself while one of them is worn.

## 1.14.27 - 2026-10-25

### Fixed - Intern recut from its sheet
- The intern skin (21 poses) is cut again from the owner's transparent sheet like Kratos and Medusa in 1.14.26: the sheet's own alpha, each figure with its nearby effects (stars, blast), the sheet's red/yellow haze and specks dropped, scaled 0.653 to the old pictures' height. Its 1.14.26 cleanup is replaced; the first pictures stay in `assets/old/shared/hero/`.

## 1.14.26 - 2026-10-25

### Fixed - Kratos and Medusa recut from their sheets, the intern cleaned up
- Kratos (21 poses) and Medusa (13) are cut again from the owner's transparent sheets, using the sheets' own alpha: every figure takes its nearby pieces (effects, stars) and drops the sheet's stray specks and red/lime haze, then is scaled to the old pictures' height (Kratos 0.643, Medusa 0.47) so they keep their size in game. Medusa's cheer snakes and beam are now whole.
- The intern, whose sheet is not at hand, is cleaned from its current files (`scratchpad` `clean/clean.py`): the grey backdrop haze and the grey ghost round its legs and mug are removed, specks dropped, small holes filled and its hard outline feathered.
- The previous pictures are kept in `assets/old/shared/hero/`.

## 1.14.25 - 2026-10-25

### Added - Siege breaking robots and horned elite shooters (Cartoon Wars 2)
- The Forge's heavy robots break twice before they are gone, like Cartoon Wars 2's gatling robots: the enemy's heavy in world 7 and our own Crusher fall into a wreck of themselves (45% of the last one's health and damage, smaller and darker), then into a crawling one, each break with a blast.
- From one minute on, every fourth wave's ranged enemies are elites, like the horned archers: 1.6 times the health, 1.8 times the damage, a gold glow and horns, and their shots are lightning.

## 1.14.24 - 2026-10-25

### Changed - Siege guardian after the fortress, and enemy flyers (Cartoon Wars 2)
- As in Cartoon Wars 2, the world's guardian no longer joins when the fortress is half down or at 2:30: it comes out only once the fortress falls (its scene plays then), 2.6 times a troop's health instead of 1.35, and the battle is won when it falls too. The enemy's health bar becomes the guardian's, in purple.
- Flyers join the enemy's waves as the battle goes on (from 1:42 in world 1 down to 0:40 in world 9), every third troop of a wave, each world its own (bat, imp, gargoyle, drone, dragon whelp…); only our ranged troops, flyers and arrows reach them. After two minutes the waves bring the heavy troop more often.

## 1.14.23 - 2026-10-25

### Changed - Siege bow lasts longer and empties like a ball
- A full quiver now keeps the arrows going about ten seconds (twice as many shots: each takes 2.5 of 100 instead of 5); it refills at 12 a second while the bow is stopped.
- The quiver bar is gone: the round bow button is the meter, as in Cartoon Wars 2. Its orange fill sinks from the top as the quiver empties, leaving see-through glass, and rises again as it refills.

## 1.14.22 - 2026-10-25

### Added - Siege sounds
- Each bow shot is heard: a new `arrow` sound, a bowstring's twang and the arrow's whoosh, its pitch a little different each time so a volley rattles instead of droning (at most one a frame).
- The missile booms, the discharge strikes and summoning a troop clicks, all with the game's own sound effects and its effects volume.

## 1.14.21 - 2026-10-25

### Changed - Siege aim stick
- The aim is a stick as in Cartoon Wars 2: two big arrows and a green knob resting between them. Drag the knob up and the arrows' landing spot moves further (down, nearer) for as long as it is held, faster the further it is pushed; let go and the knob springs back to the middle while the landing spot stays where it was. Tapping the field still aims, and the stick takes the up/down keys when focused.

## 1.14.20 - 2026-10-25

### Changed - Siege arrows rain from the sky at long range
- Aimed far (from 760 on, the furthest aim 1080), the fortress's arrows stop arcing from the wall and fall from above the view, steep and accelerating, a little behind their landing spot; between the two they blend, so the further the aim, the steeper the rain. Damage and where they land are unchanged.

## 1.14.19 - 2026-10-25

### Fixed - Siege troop portraits fill their cards
- Troop pictures are cropped to what shows (alpha over 40) on the Army tab and the battle's cards, once per picture, so the ones with wide empty margins (the Monolith, Kernel Panic, gladiator, hoplite, mud blob, crusher…) are as big as the rest.

## 1.14.18 - 2026-10-25

### Added - 17 more Siege troops
- Every world's own cast joins the army, unlocked world by world (29 troops in all): land: raider (world 2), axe thrower and shield line (3), gladiator, frog and mud blob (4), hoplite, snapper and treant (5), turret (6, the longest range), crusher and zombie (7), skeleton and haunted tomb (8) and the stone drake (9); air: the gargoyle (3) and the dragon whelp (9).
- Armies still take five land and five air troops, so there is more to choose from. A new check keeps each troop's id equal to its place in the list.

## 1.14.17 - 2026-10-25

### Changed - Siege preparation with the worlds and the game's art
- The preparation screen has three tabs as button bars (`btn1_*`, the open one gold): Map, Army and Workshop, under a header with a back button, the title and the mode's gold (`store/coins-2`), over the world map's backdrop.
- Map: the nine worlds are the action modes' own islands (`map/*.webp`) in a row to scroll, numbered, won ones with the check ring and locked ones greyed with the padlock ring. The picked world's card shows its picture, name and description, its guardian standing on the right, the gold its first (or each new) victory gives, and the green play bar to launch.
- Army: the land and air troop cards in blue frames, gold when picked, padlocked until their world.
- Workshop: each upgrade a row with its picture in a ring (army helmet, fortress plate, energy orb, bow quiver), five level pips and its price in coins.
- «How to play» keeps the instructions, keys and the preview note.

## 1.14.16 - 2026-10-25

### Changed - Siege: the Town Hall as our fortress, and a notice to turn the phone
- Our fortress is now the Backlog's Town Hall, cut from its building sheet (`fortress/backlog/town-hall.webp`): wider and more of a castle than the Inferno Tower, which stays in the same folder for later. It is also our picture beside the health bars.
- Holding a phone upright, a notice at the top of the field asks to turn it sideways for a better view; it can be dismissed and is never shown once the phone is sideways or on desktop.

## 1.14.15 - 2026-10-25

### Changed - Siege proportions on phones held sideways
- On short landscape screens the HUD and the bottom bar are thin, as in Cartoon Wars 2: square 46 px cards, shorter L·A·S tabs, a smaller bow button and camera slider, so the field takes most of the screen (the bar took almost a third of it).
- Wide fields (phones sideways, and wide desktops) zoom in a little and put the bridge deck lower (62% down instead of the middle), so less of the chasm shows and the troops keep their size. The aim control now follows the deck's height on every screen.

## 1.14.14 - 2026-10-25

### Changed - Siege: our fortress is the Backlog's Inferno Tower
- Our fortress is the Inferno Tower cut from the Backlog's building sheet (`fortress/backlog/inferno-tower.webp`, its dark backdrop removed and its neighbours' corners dropped), standing on our end of the bridge; it is also our picture beside the health bars. It is never drawn taller than the room above the deck, so its health bar stays in view.
- The camera keeps a margin left of the field, so the aim control stands clear of the tower and the bridge's own left end shows; the backdrop and the chasm's shade cover that margin too.
- The enemy wall is its world's walled bench front in every world (world 1 used the plain bench while ours was the Backlog's walled one).

## 1.14.13 - 2026-10-25

### Fixed - Siege aim always on screen
- The aim control stays at the field's left edge whatever the camera shows, as before 1.14.12's follow-the-wall change, so the arrows can be aimed while looking at the enemy's side.

## 1.14.12 - 2026-10-25

### Changed - Siege on a bridge
- The battle is fought on one long bridge over the abyss, across the middle of the field: each world's Tactics bridge (`ui/bench/bench-N`) keeps its own two ends, and its two middle slabs repeat between them from wall to wall, the troops walking on its deck. The world's backdrop now fills the whole field and darkens into the chasm under it. The floor tiles are no longer used here.
- The aim is a compact ▲ ● ▼ control standing on our wall, at most half the field's height, so it no longer runs off the screen on phones; it scrolls with the wall and hides once the wall is out of view.
- The arrows' and the missile's arcs are capped so they never leave the top of the view.
- New layout rule for this mode (`docs/siege.md`, linked from `AGENTS.md`): every visual change is checked with desktop and phone screenshots, looking at where each element sits.

## 1.14.11 - 2026-10-25

### Changed - Siege bow is a switch
- The arrows button no longer has to be held: one tap starts the archers (arrows one after another, faster and more at a time the longer they keep on), another tap stops them, and an empty quiver stops them too. The quiver refills only while they are not shooting; «Reloading…» shows while it holds less than one shot. F toggles them on the keyboard.

## 1.14.10 - 2026-10-25

### Changed - Siege ground without tile corners
- The battlefield's ground is still each world's own floor, the one On Call is played on, but only its inside: the frame of walls round its edge showed as corners every time it repeated. Every other piece is mirrored so the joins match, and a band in the world's earth colours sits under it while it loads.

## 1.14.9 - 2026-10-25

### Added - Siege L · A · S tabs, air troops and the missile
- The bottom bar has Cartoon Wars 2's three tabs: L (land troops), A (air troops) and S (special powers); the cards in the middle change with the tab (keys L/A/S, and 1–5 for the tab's cards).
- Air troops fly above the field, their shadow under them, out of reach of melee troops (only ranged ones and other flyers hit them). The flame skull is now one, and four join: the bat (from world 1), the imp (2), the drone (4, ranged) and the crystal harpy (6, area damage), all from the worlds' own flying enemies.
- Armies take up to five land and five air troops; the preparation shows them in two groups. Older saves keep their troops.
- S holds the generator, the discharge and a new missile (`fx/rocket`): it arcs from our wall to the aim and blasts there (12 s recharge, key R).

## 1.14.8 - 2026-10-25

### Changed - Siege battle laid out like Cartoon Wars 2
- Top bar: mana (energy, its rate and the army count) on the left; both fortresses' health bars face to face with «VS» in the middle, our wall and the enemy guardian at their ends; time left, coins and pause on the right.
- The field: the bow's aim is a big ▲▼ control with a green orb standing on our wall; the camera is a small slider at the field's foot (dragging still pans).
- A mana angel stands on our side of the field, a winged crystal on a pedestal that glows brighter, and fills, with the energy, pulsing when full (`fx/wings-1` tinted blue, `fx/gem-big`).
- One bottom bar: the generator and the discharge as square magic buttons on the left, the five troop cards in the middle, and the bow as a big round button on the right with its quiver meter. On phones the cards take a second row.

## 1.14.7 - 2026-10-25

### Fixed - Arena thrower and shield wall sizes
- The Arena's thrower (`greek-ticket`) drew about 48 px tall, taller than its own shield wall and every other world's thrower (28–45 px); `SPRITE_CANVAS` k 3.5 → 2.6 brings it to about 36 px.
- Its shield wall (`greek-legacy`), the cast's tank, drew about 46 px; k 1.381 → 1.69 makes it about 56 px tall and 61 px wide, the biggest of the three as in the other worlds. The board's equal-height rule is unchanged.

## 1.14.6 - 2026-10-25

### Changed - Siege bow with a quiver meter
- Arrows no longer fly on their own or as a fixed volley. Hold the arrows button (or F) and they fly one after another at the aim, faster the longer it is held (up to twice as fast after 2.5 s, plus one more arrow at a time); each shot empties the quiver meter on the button, and let go it fills again. Run dry, it shows «Reloading…» until a third is back.
- New workshop upgrade, the Bow (five levels): shoots more often and adds an arrow per shot every two levels. Older saves start it at level 0.

## 1.14.5 - 2026-10-25

### Added - Siege story
- The campaign is told in story scenes, Cartoon Wars-style: the world's map picture behind, the speaker's portrait on their side and one line at a time (Next, or Skip to the end).
- Launching a fortress opens its world's scene: the narrator and your commander (your hero, under your name). World 1 starts with a three-line prologue.
- Each world's guardian speaks when it joins the battle (its standing pose on the right, its name from the action modes), and your commander answers; the battle waits until the scene ends.
- Retrying a battle skips the intro. All lines are in `src/strings.ts` in English and Spanish (`src/siege/story.ts` sets who says what).

## 1.14.4 - 2026-10-25

### Changed - Final bosses' songs sound like their worlds
- Six final-boss songs were whole new tunes that only shared their world's sounds; they are now their world's song as a boss version (same key, lead and melody, darker chords and a harder bass, starting on the drop):
  - Kernel Panic: the Backlog's chiptune melody in C minor, back on the Amen break.
  - Medusa: back in the mud world's D (it was a semitone lower), on its snake charmer tune.
  - Drakkar/Valdur: Code Freeze's horn call as a war march.
  - Carnivorous Queen: Legacy Jungle's marimba tune with a Phrygian bite.
  - Overclock Mech: The Forge's robot riff, faster.
  - Shadow Wraith: Haunted Servers' music box tune with the tritone.
- The Archdemon and Zeus already followed their worlds; Nocthrax plays Doomsday.

## 1.14.3 - 2026-10-25

### Changed - Nocthrax fights to Doomsday
- With the music «by world», the last boss, Nocthrax, now plays Doomsday (the final-boss song) instead of its own boss song.

## 1.14.2 - 2026-10-25

### Changed - Siege troops show their blows
- The boss sheets swap to their wind-up pose to strike and their flinch when hit; the other troops lunge forward and lean back.

## 1.14.1 - 2026-10-25

### Changed - Siege looks like Cartoon Wars 2, with the game's own art
- The battlefield is a side-scrolling scene: each world's map picture (`map/pv-*.jpg`) is the backdrop, panning slower than the troops, over the world's own sprint floor (`floors/worldN`).
- Each world sends its own guardian, its room-6 boss sheet (monolith, overlord, valkyrie, mud monster, queen, minotaur, mainframe, wraith, hydra), instead of the monolith everywhere.
- Troops walk on all their poses (six for the Arena and fire-world sets, four for the rest, the boss sheets' two steps and a stand) instead of two.
- Our fortress has archers instead of a cannon, like Cartoon Wars' castle bow: three arrows every 2.2 s on their own, and the volley button (was the cannon) rains seven. A vertical bow slider at the field's left sets where they land (up is farther); tapping the field still aims.
- Arrows are the bow's painted ones (`arrows/fire` wood from the fortress, `arrows/water` for our troops, `arrows/leaf` for theirs), flying in an arc; hits up close are impacts, and the discharge drops the yellow lightning bolt over a blast.
- The fortresses are the Tactics benches' walled fronts (`ui/bench/boss-N`): ours the Backlog's blue one, the enemy's its world's (the Backlog defends with its plain bench); the drawn tower stays only while they load.
- Pause, launch, generator, cannon and discharge use the `btn1_*` button bars (grey when unavailable).

## 1.14.0 - 2026-10-25

### Added - Siege / Asedio playable preview
- Playable Siege entry inside the existing fourth main-cover Coming Soon hub, preserving its separate Fortress link. Labelled “Coming soon · Playable preview” in English and Spanish. Opens preparation and a complete lateral fortress battle without changing the existing PlayMode save schema.
- Choose five troops, summon with regenerating energy and cooldowns, upgrade the in-battle generator, aim a friendly-fire-free cannon and trigger an area discharge. Troops fight automatically; opposing waves and a guardian defend the rival fortress. Includes victory, defeat, a five-minute limit, retry and pause/resume.
- Nine themed preview fortresses, eight troop families, independent unlocks, workshop upgrades and gold rewards. Validated versioned local save; reward settlement is idempotent. Existing action/Battle economies and Fortress are unchanged.
- Responsive portrait/landscape layout, camera drag/slider/base shortcuts, keyboard controls, background/tab pause, focus containment, reduced-motion handling and listener/animation cleanup.
- Existing sprites are reused unchanged. The fortresses/scenery and shared guardian are preview visuals; balance and campaign content remain experimental.
- New isolated `src/siege/` implementation and mode documentation. `test:game` also runs the Siege model regressions.

## 1.13.51 - 2026-10-24

### Added
- A fourth **Coming Soon** position in the main cover's game-mode carousel, using the same existing button artwork in grayscale with a gray indicator.
- The fourth slot opens a new-modes preview hub containing a link to the experimental Fortress Siege lab.
- The fourth position is not a persisted PlayMode; existing Sprints, On Call and Battle save values and game logic remain unchanged.

## 1.13.50 - 2026-10-24

### Fixed - Locked worlds on the map
- A locked world's play button is the same art in grey, and it no longer offers the Boss Rush, the bosses' showcase or Nightmare.

## 1.13.49 - 2026-10-24

### Fixed - Boss Rush
- Two stages a world again, its room-6 boss and then its final boss; the small-boss stages, which wore the cast's old four-frame sprites, are gone (world 1 alone is 2 rounds, five worlds 10).

## 1.13.48 - 2026-10-24

### Added - Fortress PvE assault prototype
- Three small isometric enemy bases can now be assaulted from outside their perimeter.
- Three temporary troop archetypes (warrior, thrower and tank), eight deployments, auto-moving and building damage with a basic wall and cannon combat model.
- Percentage destruction and up to three stars: 50%, Core Hall down, and 100%.
- Retry and troop choice controls, simple attack timer and troop/building health feedback.

### Limitations
- Troops are placeholder markers rather than existing BUG HUNTER unit sprites; damage/pathfinding are early prototypes, not production-ready.
- Fortress remains an isolated lab, not integrated into the game's main menu.

## 1.13.47 - 2026-10-24

### Added - Fortress isometric scene
- Fortress Lab now draws diamond-shaped isometric terrain instead of the initial rectangular CSS grid.
- Pan with drag, zoom with pinch or wheel, tap a diamond to inspect its coordinate and building; reset controls work in both orientations.
- Five adjacent wall segments in test level 3 are displayed as a continuous stone wall with end caps.
- The existing three simple test layouts and temporary building sprites are preserved; the lab remains separate from the live game menu.

## 1.13.46 - 2026-10-24

### Fixed - Fire-world cast and Kernel Panic recut from their own transparency
- Both sheets already came transparent, but they were opened as RGB, which dropped their alpha and left the painted backdrop; they were then cut against that backdrop, losing wings, fire and the Kernel's glitch effects and leaving its fringes. They are now laid out straight from the sheet's own alpha, untouched (`scratchpad` `cutalpha.py`: each cell's pieces, specks under 30 px dropped, feet on a shared baseline): the imp, skull and gargoyle with whole wings and fire (the gargoyle walks with its own first poses again, the imp flinches with its own), and the Kernel Panic with its full orbs, spirals and spark. New `SPRITE_CANVAS`/`BOSS_CANVAS` to match.

## 1.13.45 - 2026-10-24

### Changed - New Kernel Panic
- The Backlog's final boss, the Kernel Panic (`bosses/kernel-0..8.webp`), redrawn by the owner at a higher resolution in the game's pose order: two steps and a stand, the red-screened wind-up, the charge in a dust cloud, the ring of red error orbs, the glitch volley, the double spiral and the cracked-screen flinch. The sheet came on a purple gradient, so it was cut by colour distance from the inpainted backdrop like the fire world's cast (`scratchpad` `kp/cutk.py`), wider and more sensitive in the three poses whose effects share the backdrop's purple, pieces touching a cell's edge dropped; the flinch's square shadow from the sheet faded by hand. `BOSS_CANVAS.kernel` k 2.0, feet 0.0772. The old pictures are kept in `assets/old/01-backlog/bosses/`.

## 1.13.44 - 2026-10-24

### Changed - New Arena shield wall
- The Arena's legacy, the shield wall (`enemies/greek-legacy-0..5.webp`), redrawn by the owner as a chibi six-pose sheet: three warriors behind two big shields, a hoplite's spear over them; two steps and a stand, the wind-up with swords and spear raised, the thrust and a flinch. Cut like the gladiator and the hoplite, each pose kept to its own figure so the neighbouring pose's spear streak does not come in; `SET_FRAMES['greek-legacy']` 6, `SPRITE_CANVAS['greek-legacy']` k 1.381, feet 0.0048. The Arena's whole cast now has six poses; the old pictures are kept in `assets/old/06-the-arena/enemies/`.

## 1.13.43 - 2026-10-24

### Changed - New Monolith
- The Backlog's room-6 boss, the Monolith (`bosses/monolith-0..8.webp`), redrawn by the owner as one 3×3 sheet on white at a far higher resolution (its body was about 90 px tall, now about 330): stance, two steps, wind-up, the charge with a purple trail, the ring of rocks, the bug-report volley, the ground slam and a flinch with an X-eyed screen. Cut with `kernel/cut.py` `seg`, `EDGECUT=1`, `HOT=1` at up to 520 px, its cells set by hand where the trail, the ring and the slam ran past the thirds; `BOSS_CANVAS.monolith` k 2.45, feet 0.2243. The old pictures are kept in `assets/old/01-backlog/bosses/`.

## 1.13.42 - 2026-10-24

### Changed - New fire-world cast
- The fire world's bug, ticket and legacy redrawn by the owner as six-pose sets: a flying imp, a floating flaming skull that spits a fireball, and a stone gargoyle with lava cracks (`enemies/demon-{bug,ticket,legacy}-0..5.webp`, `SET_FRAMES` 6, new `SPRITE_CANVAS`; the imp's icon remade). The sheet came on a red gradient, so they were cut by their colour's distance from the backdrop, inpainted and blurred, with the segmentation mask for the figure (`scratchpad` `demon/cutd.py`): dark wings and bright fire are kept, the haze is not; the gargoyle's two first poses lost part of their wings against the dark, so its walk uses its full-winged poses, and the imp's ragged flinch is its stance.
- The four-frame pictures they replace are kept in `assets/old/02-hotfix-inferno/enemies/` (with a README), not loaded by the game. The sheet's bottom row, an infernal sorcerer, has too few poses for a skin.

## 1.13.41 - 2026-10-24

### Changed - New Arena hoplite
- The Arena's ticket, the hoplite (`enemies/greek-ticket-0..5.webp`), redrawn by the owner as a chibi six-pose sheet in blue with a spear: two steps and a stand, the wind-up, the throw with the spear flying off and a flinch. Cut like the gladiator (`greek/cut6.py`, spear tips kept solid), and both recut with their rims pulled in a pixel and unblended from the paper's white so no pale halo shows on the floor, the paper trapped between a spear or sword and the body dropped, and every blade filled to its outline (its white ridge and tip were cut away as paper); `SET_FRAMES['greek-ticket']` 6, `SPRITE_CANVAS['greek-ticket']` k 2.928, feet 0.0078.

## 1.13.40 - 2026-10-24

### Added - Skins in the shop
- A «Skins» section at the top of the shop, folded like the others, with the worn hero as its icon and how many you own: every skin as a card with its standing picture, name, joke and price, in the list's order. A skin on sale is unlocked here («Desbloquear · 🪙 N», `data-skin-buy`); one not yet open shows its gate («🔒 Gana el mundo N»…) greyed; one owned offers «Ponérsela en Personalizar», which opens Customise's character list, and the worn one reads «✓ Equipado». As with items, the shop only unlocks: skins are still worn (and can still be bought) in Customise.

## 1.13.39 - 2026-10-24

### Changed - New Arena gladiator
- The Arena's bug, the gladiator (`enemies/greek-bug-0..5.webp`), redrawn by the owner as a chibi six-pose sheet: two steps and a stand, the wind-up, the strike with a golden swoosh and a flinch. Cut on one canvas (segmentation mask for the figure, effects unblended from white, each pose centred on its body with its feet on the bottom; the white and pale metal its outlines enclose, the sword blades, kept solid, since the mask left them see-through; `scratchpad` `greek/cut6.py`), its icon for Customise remade from the stand. The Arena's other kinds keep their four frames: a set can now have its own frame count (`SET_FRAMES` in `draw.ts`); `SPRITE_CANVAS['greek-bug']` k 2.084, feet 0.0084.

## 1.13.38 - 2026-10-24

### Added - Fortress early prototype
- Ten distinct transparent SVG placeholders for the first Backlog fortress buildings and wall; one asset file per building, not level upgrades.
- Three very easy Fortress layout test stages: Core Hall, resources, and a cannon with five wall pieces.
- Standalone responsive layout inspector at `/fortress-lab.html`; select buildings in landscape or portrait. Fortress is still not a playable or integrated game mode.
- Asset projection support for `assets/special/fortress/` and asset manifest for future integration.

### Scope
- These are new simple placeholders, not actual crops from the earlier concept sheets. Original gameplay modes remain unchanged.

## 1.13.37 - 2026-10-24

### Changed - New Minotaur
- The Arena's room-6 boss, the Minotaur (`bosses/minotaur-0..8.webp`), redrawn by the owner as one chibi 3×3 sheet, all poses at one scale: stance, two steps, wind-up, horns-first charge, sword spin (ring), three golden javelins (move), sword slam (signature), flinch (hit). Cut at full resolution (up to 520 px, the old one came from a sheet shrunk to 63%) with `kernel/cut.py` `seg`, `EDGECUT=1`, `HOT=1`, its cells set by hand where the javelins and the ring ran past the thirds; `BOSS_CANVAS.minotaur` k 2.83, feet 0.2455.

## 1.13.36 - 2026-10-24

### Changed
- Phone Tactics: the arena's floor picture ends at the shop's middle instead of the bottom of the screen, a little squashed, so its own lower wall shows round the bench rather than hidden below the shop; the top fence stays whole.

## 1.13.35 - 2026-10-24

### Changed
- Phone Tactics: the shop panel (cards and buttons) sits lower, 22 px into the home bar's safe area on an iPhone (2 px from the bottom elsewhere), and the bench 12 px lower than before against it; the board grows into the room they leave.

## 1.13.34 - 2026-10-24

### Changed
- Phone Tactics: your hearts move to the lower right of the screen, still on the bench caption's line; the caption is back at the left.

## 1.13.33 - 2026-10-24

### Changed
- Phone Tactics: your hearts (♥ ×N, red from 3 down) sit at the lower left on the bench caption's line, the caption beside them, while preparing and fighting (`.board-life`); they are no longer drawn over your hero there. Desktop and Fusion are unchanged.

## 1.13.32 - 2026-10-24

### Fixed - Units on the board's last row could not be dragged
- Since the board moved half a cell lower (1.13.30) the bench's seats lie over its last row on the phone, and they took the touch, so a unit standing there could not be dragged. Now only the seats themselves take the pointer (empty seats none; the tray, the bench and its art never), a press on a seat over a board unit is handed to the board, and a drop counts as the bench only on a seat itself (`benchSeatAt`), so the last row stays the board's.
- Checked with Playwright at 390 px: last-row units drag with the bench empty and full, reserves still deploy, and shop cards still drop onto the last row. On localhost `window.bugHunterBoardLay` exposes the board's layout for such tests.

## 1.13.31 - 2026-10-24

### Changed
- World 8's scenery (`scenery/grave-*.webp`: the graves, fences and coffins used as blocks in every mode and as the board's wall) has its purple flames turned blue like its floor and bench; the orange candles stay.

## 1.13.30 - 2026-10-24

### Changed - Bench seats, board position and world 8's colours
- Bench seats are fixed: a reserve keeps the seat it is put on and gaps are allowed (`slot.r`, `freeSeat`, `moveBenchSeat` in `board.ts`). A shop card or a board unit dragged onto a seat goes to that seat (onto an occupied seat a board unit swaps with the reserve there); a reserve dragged onto another seat moves there, swapping. A tapped card that overflows still takes the first free seat.
- Phone Tactics: the bench sits higher (24 px) and the whole board, wall included, half a cell lower.
- World 8's floor (`floors/world8.webp`, used by every mode) has its purple mist and flames turned blue, like its bench; the orange candles stay.
- New regression check for the bench seats (28 in all).

## 1.13.29 - 2026-10-24

### Changed
- The bench's stars float clear above each unit's head instead of over it; on desktop the bench caption moved up so the stars do not run into it.

## 1.13.28 - 2026-10-24

### Added - Convergence background in Customize
- Added the original Convergence arena as a free selectable scene in Customize → World, with its own thumbnail and saved selection.
- Battle draws the selected background within the existing arena bounds; board geometry, unit positions, divider animation, bench and shop layout remain unchanged.
- Sprints can use the same floor and On Call its tiled interior, following the existing cosmetic scene behavior. Gameplay worlds and progression are unchanged.
- Reuses the original JPEG without editing, resizing or recompressing the source asset.

## 1.13.27 - 2026-10-24

### Changed - The board's own stars on the bench
- The bench's stars are the ones the board draws: the painted star of `ui/icon_star.webp` recoloured bronze (★1), silver (★★) and gold (★★★), overlapping in a row over the unit's head. Baked once as `assets/shared/ui/star-1..3.webp` with the board's own crop and colours (`starPicture` in `boardViewRender.ts`). ★1 now shows too, as on the board.

## 1.13.26 - 2026-10-24

### Changed - Rarity and stars on the bench
- Under each reserve a glowing oval in its rarity's colour, the same as the board's rings: grey common, blue rare, purple epic, orange legendary, red mythic (half as bright while fighting).
- Its stars are gold ★ over its head, plain glowing text, in place of the dark pill at its feet that hid under the seats.

## 1.13.25 - 2026-10-24

### Changed
- On the phone the Tactics bench runs from one edge of the screen to the other, like the bonuses' rail.

## 1.13.24 - 2026-10-24

### Fixed - Reserves lined up on the bench
- The reserves stood at different heights: each sheet's picture carries its own empty margin under the feet and round the figure, and they were fitted to one box by its bottom edge, so a picture with more margin floated higher and one with more room round it came out smaller. Each picture is now cropped to what shows (`trimPic` in `main.ts`, alpha over 40, kept per picture) and stood with its feet on the seats' line, at one height per step (bug, thrower, heavy, sub-boss, boss: `--u` in `game.css`), on the phone and on desktop. On desktop the stars sit under the unit.

## 1.13.23 - 2026-10-24

### Changed
- The phone's Tactics bench sits 3 px higher.

## 1.13.22 - 2026-10-24

### Changed - Bench lower, behind the shop, and kept in the fight
- Phone: the bench hangs from the tray's top (100 px, it was 140) with its seats just over the shop and the rest of the picture going on down behind the shop's panel, uncropped; the tray sits under the shop (`z-index`). The reserves are drawn bigger on their seats.
- The bench stays in view while fighting (phone and desktop), its reserves dimmed (`brightness(0.5)`) and not draggable; its caption hides in the fight on the phone, where it ran into the army counter.

## 1.13.21 - 2026-10-24

### Changed - One four-seat bench per world in Tactics
- The Tactics reserve is now a single bench, the owner's four-seat art for the world being played (`assets/shared/ui/bench/bench-1..9.webp`, 640 px wide), cut from his dark sheets with the segmentation model, the glows (flames, lava, ghost fire, crystals) kept as light unblended from the backdrop and the drop shadows dropped. It replaces the per-unit platforms of 1.13.12–1.13.13, whose pictures (`world-N`, `boss-N`) are no longer used.
- The reserves stand on its four seats (`BENCH_ART` in `main.ts`: each bench's height and the seats' line, the seats between 15% and 85% of its width), their stars at their feet.
- Phone: the bench spans the tray's width at its own shape; the tray is 140 px (it was 94), and the bench's tops rise a little over the board's bottom edge. Desktop: the bench is horizontal, 340 px, in the open strip left of the board (beside it when there is no room).

## 1.13.20 - 2026-10-24

### Added - Guide pages for the worlds and the shop
- «Mundos / Worlds» (9 pages now): a screenshot of the World map (`book/map.webp`, `map-en.webp`) and how it works: islands and their badges, each mode's own progress, and the play button's options by swiping or its arrows (world, Boss Rush and See the bosses in Sprints; world and Nightmare in On call; Fusion and Tactics on the Board).
- «Tienda / Shop»: a screenshot of the shop (`book/shop.webp`, `shop-en.webp`; the localhost-only test-ad gift was removed before taking it) and its sections: coins, the Forge, Armour and Weapons, the Arsenal and Spirits.
- Both shots are shown whole (`object-fit: contain`), so the map's play button and the shop's coins are in view.

## 1.13.19 - 2026-10-24

### Changed - English guide screenshots
- The guide's pictures that show the game's words (Fusion, Tactics, the abilities panel and Customise) have English copies, `book/<name>-en.webp`, taken the same way, shown when the game is in English (`bookPic`). Sprints and On call have no words in them and stay shared.

## 1.13.18 - 2026-10-24

### Changed - Guide: swipe between pages, Fusion and Tactics explained apart
- A clear sideways swipe on a guide page turns it (left for the next, right for the last), with a short slide; the Next and Back buttons stay, and the page counter says «desliza para pasar página». The mode bar on the first page keeps its own swipe, which changes the mode. The guide's pictures take no drag of their own and its box only scrolls vertically, so the swipe is not cancelled.
- The single Board page is now two (7 pages in all): «Tablero · Fusión» (summon, merging by dragging or the auto-merge, the fight) and «Tablero · Táctica», explained further with two world-1 screenshots: the shop, bench and army (`book/tactics.webp`) with rarity, price, stars, bench and the +15% for the world being played; and the abilities panel (`book/tactics-bonus.webp`) with each world's ability and the two-worlds / five-units boost. Fusion's picture is `book/fusion.webp`. Screenshots taken with Playwright at 390 px.

## 1.13.17 - 2026-10-24

### Changed - Clearer guide: the play bar to learn on, and a Customise page
- The guide's first page no longer lists the three modes as separate buttons: it shows the cover's own play bar (the arrowed bar in the mode's colour, with the mode's description), which is swiped or turned by its arrows like on the cover, with dots under it, a pulsing «⬅️ Swipe it or tap its arrows ➡️» and a finger sliding across it. Picking a mode there still sets the cover's mode.
- New guide page, «Customise» (6 pages now): a screenshot of the screen (`assets/shared/book/custom.webp`, taken with Playwright at 390 px) and three short points: the slots and the amulet, the round buttons (character, enemies, world, music), and that items are unlocked in the Shop.
- The finger and the hint stand still under `prefers-reduced-motion`; retro shows plain bars with ‹ › arrows.

## 1.13.16 - 2026-10-24

### Changed - Wider play bar on the phone cover
- The cover's play bar now spans from the left card's edge to the right card's, with its tap area and arrows moved out to match. The desktop cover is unchanged.

## 1.13.15 - 2026-10-24

### Changed - Gold achievements button
- The profile's «Logros» button is the gold simple bar (`btn1_gold`) with black text.

## 1.13.14 - 2026-10-24

### Changed - One button rule: tap or swipe
- Every button you only tap now uses the simple bar, the shape of «Conectar con código», in its own colour: new `assets/shared/ui/btn1_{blue,green,orange,red,gold,purple}.webp`, the grey `btn_gray` with its face recoloured. This covers every dialog (profile, pause, end of run, shop, Customise, the guide, the board's buttons, the friends' «Conectar»), keeping each button's colour and icon.
- The bar with the big arrows and leaves (`btn2_*`) now means «swipe me»: only the cover's play bar and the map's play button when it has more than one option wear it.
- The cover's play bar is that arrowed bar in the mode's colour (green Sprints, red On call, blue Board), laid over the painted one with its words centred, on a dark rail of the same shape.
- Swiping a play bar now drags it with the finger; let go past 40 px and the next option slides in from that side, otherwise it springs back. Nothing moves under `prefers-reduced-motion` beyond the drag itself. The cover's painted cards (map, shop, Customise, options) are unchanged.

## 1.13.13 - 2026-10-24

### Changed - One platform per reserve, grander ones for bosses
- The single mobile platform of 1.13.12 was stretched to the bench's width and came out squashed, half hidden under the shop. Every reserve now stands on its own platform at its own shape, on mobile as on desktop.
- The platform is the unit's own world. Sub-bosses and bosses (tier 3 and up) stand on the owner's second, grander set (`assets/shared/ui/bench/boss-1..9.webp`, `/images/game/ui/bench/boss-N.webp`), cut from his opaque black sheet: solid body, glows unblended from the black.
- An empty slot shows the played world's platform, faint. Retro look and bench behaviour are unchanged.

## 1.13.12 - 2026-10-24

### Changed - World platforms for the Tactics bench
- The Tactics bench now stands on the owner's platform art, one per world (`assets/shared/ui/bench/world-1..9.webp`, served as `/images/game/ui/bench/world-N.webp`), cut from his 3×3 sheet: Backlog server slab, lava rock, frozen Viking dais, mud swamp, jungle ruin, Arena marble, Forge furnace, haunted grave stone and Core crystal.
- The platform is the world being played. On mobile it spans the whole width of the bench and the reserve units stand on it; on desktop, where the bench is a column, each slot stands on its own copy at its own shape.
- It replaces the small per-unit world blocks of 1.13.6. Retro look, bench behaviour, drag and drop and capacity are unchanged.

## 1.13.11 - 2026-10-24

### Fixed - Board bugs (Tactics and Fusion)
- Online board fights could play out differently on each phone: an army arriving over the link was still clamped to the old rows 4–7, while your half is now rows 5–8. A unit on the back row was moved forward (onto the wall row or another unit) on the rival's phone only. It is now clamped to the real board (`COLS`, `HOME_ROW`, `ROWS`).
- A run could lock: with no units on the board or the bench and not enough gold for the cheapest card (Tactics) or a summon (Fusion), the fight button stayed disabled for good. It is now enabled in that case (`stranded`/`canFight` in `board.ts`); the round is lost and its gold paid as usual.
- Fusion auto-merge: when a unit waiting to merge was sold or moved during the lightning, the other pairs on the board stopped merging until the next summon. They now merge in turn.
- Fixed two TypeScript errors (`openPrivacyChoices` on `window`, an unused parameter in `queenVineWalls`), so `npm run typecheck` passes again.
- Regression checks updated to the current Tactics rules (a bought card's slot is refilled; at army capacity an extra unit goes to the bench) and new checks added for the lock and the auto-merge. 27/27 pass.
- No combat values, prices or balance changed.

## 1.13.10 - 2026-10-24

### Fixed - Tactics bonus counters
- Fixed the Tactics bonus rail showing the same `x/5` value on every world medallion. Since 1.13.3 each icon was incorrectly displaying the total deployed army size, so all bonuses repeated the same counter.
- Each medallion now shows the deployed count for its own world, capped at `5/5`. Example: two Backlog units, one Jungle unit and two Forge units display `2/5`, `1/5` and `2/5` respectively.
- Updated the bonus-panel hint to make the distinction explicit: the per-icon counter describes world composition, while the actual Tactics power-up rule remains global — mix at least two worlds, then reach five deployed units for the stronger combo.
- No Tactics combat values, synergy thresholds or unit stats changed.

## 1.13.9 - 2026-10-24

### Fixed - Mobile Tactics bench positioning
- Fixed the actual cause of the reserve disappearing on mobile: the bench container was being given viewport `left/top` coordinates by the desktop/floating positioning path while also being `position: relative` inside the mobile tray.
- Mobile Tactics now lets `boardMobileTray` own the reserve position and explicitly clears stale inline `left/top` offsets.
- The four world-plinth reserve slots and the overlaid `Bench · n/4` caption remain, and the board keeps the extra vertical space reclaimed in 1.13.7.
- Desktop reserve positioning and drag/drop behavior are unchanged.

## 1.13.8 - 2026-10-24

### Fixed - Tactics bench visible again
- Fixed the mobile Tactics reserve disappearing after the 1.13.7 bench-caption overlay change.
- The reserve now uses an explicit four-column grid with a fixed 94 px tray and 88 px visible slots instead of relying on flexible square aspect-ratio sizing that could collapse or overflow off-screen.
- The `Bench · n/4` caption remains overlaid in front of the board, so the board keeps the space reclaimed in 1.13.7.
- Bench drag/drop behavior, capacity, unit art, world plinths and desktop layout are unchanged.

## 1.13.7 - 2026-10-24

### Changed - More mobile board space
- Mobile Tactics no longer reserves a separate row for the `Bench · n/4` caption. The caption now floats over the lower edge of the board, in front of the arena.
- Reclaimed the former caption height for the playable board by reducing only the reserve tray's reserved height by 18 px; the reserve-unit plinths keep approximately the same usable size.
- The army-capacity chip remains positioned under the divider and neither label intercepts unit dragging.
- Desktop layout, combat geometry, bench capacity, shop layout and gameplay are unchanged.

## 1.13.6 - 2026-10-24

### Changed - Tactics reserve and world identity
- Replaced Tactics bench rarity-card frames with physical world plinths: each reserve unit now stands directly on an existing square scenery block from its own world. Character names are removed from the compact bench; stars remain as the progression indicator.
- The bench reuses existing world art without adding, resizing or recompressing assets. Mud intentionally uses the same wet-stone fallback already used by its arena wall rendering.
- Gave all nine world-ability medallions distinct identity colours through their background, ring and glow: Backlog lime, Inferno orange-red, Code Freeze cyan, Mud ochre, Legacy Jungle emerald, Arena gold, Forge royal blue, Haunted Servers violet and Core magenta.
- The same world colours appear in the bonus details panel, making similarly coloured source icons such as Code Freeze and Legacy Jungle easier to distinguish.
- Gameplay, Tactics/Fusion balance, unit stats, drag/drop behavior and public asset URLs are unchanged.

## 1.13.5 - 2026-10-24

### Changed - Harder Fusion AI
- Fusion round 1 remains introductory. From round 2 every rival wave is guaranteed at least one merged Ticket-tier unit.
- From round 4 every Fusion rival wave is guaranteed at least one Legacy-tier unit; from round 7 it is guaranteed two. Sub-bosses and final bosses remain confined to their intended rounds.
- From round 2 Fusion rival waves receive 20% more composition budget and strongly prefer spending that budget on higher merged tiers instead of filling the board with base Bugs.
- Fusion enemy combat strength rises from 95% in round 1 to 105% in round 2, then gains 4.5% per round, reaching about 138% by round 9 and 143% by round 10 before tier, world and boss effects.
- Tactics star progression, player Fusion economy, summon probabilities, merge rules and player unit stats are unchanged.

## 1.13.4 - 2026-10-24

### Changed - Much harder Tactics AI
- Round 1 remains the introductory fight, but from round 2 the rival is guaranteed at least one 2-star unit.
- Rival star progression is much faster: more 2-star units appear each round, the first 3-star unit appears from round 7, and up to two 3-star units appear from round 9.
- From round 2 the Tactics rival receives 20% more wave budget, allowing stronger and/or fuller enemy boards without changing Fusion waves.
- Tactics AI combat strength rises from 90% in round 1 to 100% in round 2, then gains an additional 4% per round, reaching 132% base strength by round 10 before star multipliers and world abilities.
- Fusion enemy strength, Fusion star behavior, player unit stats and player economy are unchanged.

## 1.13.3 - 2026-10-24

### Changed - Tactics bonus rail
- Tactics world-ability medallions are pinned flush to the right edge of the viewport with no horizontal margin.
- Their compact counter now shows team progress toward the five-unit enhanced-combo threshold as `current/5` (capped at `5/5`) instead of repeating the number of distinct worlds.
- The bonus details panel uses the same numeric progress. Fusion synergy counters and combat rules are unchanged.

## 1.13.2 - 2026-10-24

### Maintenance - Assets organized by world
- Grouped the nine worlds under `assets/worlds/`, with their existing enemies, bosses, floors and scenery. Common art is under `assets/shared/`; secret-shift bosses are under `assets/special/secret-shift/`.
- Preserved sprite filenames, numbered frames and original Git blob contents. No image resizing or recompression, gameplay changes, save changes or combat-layout changes are included.
- Added a build-only asset-path resolver: the browser still receives the same `/images/game/...` URLs. Runtime renderers, CSS and HTML image URLs are unchanged.
- Development asset watching uses the same mapping and isolates per-world deletion. Duplicate URLs, case-only collisions, file/directory conflicts and symlinks fail explicitly instead of overwriting files.
- The post-build check now compares the exact mapped public asset set and its bytes in both `dist/` and `public/`.
- Updated README images, source-path examples, asset documentation and development guidance. Added 24 asset-layout tests to the existing layout test command.

### Verification and limits
- The 24 new fixture tests passed locally on Node 22.16.0; the changed integration JavaScript passed syntax checks. The project requirement remains Node 24.x.
- These checks exercise asset projection, copying, development-watcher behavior and output verification with temporary fixtures. They are not a full production build, a complete project typecheck or in-game visual validation. The existing preparation tests remain in the command; no new claim is made here about running the complete project suite.

## 1.13.1 - 2026-10-24

### Maintenance - Dedicated game directory
- Consolidated game source, HTML, art, development scripts, documentation and release notes under `bug-hunter/`, with a README visible when opening that folder.
- Moved `src/game/` to `bug-hunter/src/` and `static/images/game/` to `bug-hunter/assets/`. Gameplay modules and art bytes are unchanged; the version metadata and asset documentation were updated.
- The shared Vite configuration prepares disposable public files while preserving `/game.html` and `/images/game/...` in development and production. The root `game.html` is now generated and ignored, not a second editable source.
- Kept the shared storage implementation through a small adapter, without changing save keys. Updated TypeScript includes and the existing game regression script's source paths.
- Added 12 dependency-free integration tests for the preparation layer, plus a post-build check that verifies every game asset in both `dist/` and `public/` byte-for-byte against its source.
- Root documentation links to the game; the previous detailed agent notes are retained as a historical document. The old changelog path remains a navigation link.

### Verification and limits
- All 12 integration tests passed locally with temporary fixtures and a mocked development-server interface. The integration JavaScript passed Node's syntax check.
- These checks do not constitute a full Vite production build, a complete project typecheck, or in-game visual validation. No gameplay, balance, layout, sprite-resolution, save-schema or combat-animation changes are included in this release.

## 1.13.0 - 2026-10-23

### Release - Tactics update
This minor-version milestone consolidates the Tactics work and related boss changes already released through v1.12.61. The entries below retain their original version numbers and details; they are not retroactively renamed.

### Tactics and mobile battle layout
- Stable board geometry and floor framing across preparation, combat and results, while preserving the divider's original lowering/raising animation.
- Mobile board shifted down 8 CSS pixels without resizing cells; dragging and hit testing use the same origin. The army-capacity counter sits below the divider on the left, and the bench heading is left-aligned above the reserve cards.
- Queen's visible vine-wall segments, five-lane roots and staggered thorn volleys; Wraith's ghost formations and delayed targeted strike. Final-boss conditions use the reachable tier 4, and delayed geometric volleys retain their intended flight lifetime.
- Existing tactical damage budgets, shop/card positions and desktop layout are preserved.

### Related boss changes in Sprints / On Call
- Queen's warned thorn-vine walls and expanded root patterns; Wraith's additional clone projectiles and staggered ghost fans.
- Medusa keeps her generic backup summons, using purple or turquoise snakes instead of frogs according to her phase.
- Kernel Panic's introductory difficulty remains unchanged.

### Versioning and scope
- The game version advances from 1.12.61 to 1.13.0. Follow-up fixes to this milestone use 1.13.1, 1.13.2, and so on; a future substantial feature milestone can advance the minor version again.
- This commit changes only version metadata and release notes. It introduces no additional gameplay, balance, layout or asset changes, and does not imply new runtime or visual validation. The verification limits recorded for earlier patches still apply.

## 1.12.61 - 2026-10-23

### Changed
- Mobile battle board: translate the grid, units and divider 8 CSS pixels down without resizing cells. Hit testing uses the same translated origin.
- Mobile Tactics: move the existing army-capacity label below the divider on the left, and left-align the bench heading above the reserve cards. Live counts and localized labels are preserved.
- Shop/card positions, desktop layout, combat rules and the divider's raise/lower animation are unchanged. Preparation/fight/results keep the stable viewport introduced in 1.12.60.

### Verification and limits
- Ten local mocked integration/geometry checks passed, covering phase stability, unchanged cell scale, hit coordinates, label positioning, 600-frame non-accumulation, rerendering and desktop restoration.
- The integration module passed an isolated strict TypeScript check against the renderer's public signatures. Full production build and in-game visual testing were not run for this change.

## 1.12.60 - 2026-10-23

### Fixed
- Restored the divider's original sink-on-fight and rise-on-results animation. Version 1.12.58 incorrectly disabled that animation instead of fixing the layout.
- Mobile board geometry and floor framing now retain preparation's reserved shop/bench space while combat controls replace them. This fixes the divider's screen-position jump without freezing its animation.
- Split the existing, restored rendering implementation into boardViewRender.ts and the small viewport integration into boardView.ts; existing imports and desktop geometry are preserved.
- Queen's five-lane tactical roots and Wraith's delayed tactical strike now activate at their reachable final tier (4), rather than requiring an unavailable tier 5.
- Queen/Wraith delayed geometric volleys include the waiting period in their lifetime, so later waves retain the intended 2.4 seconds of flight.
- Queen's tactical wall endpoints now agree with the planner's 20-unit clamp, preserving the full 70-unit opening.

### Verification and limits
- Local geometry/integration tests and boss-planner regression tests passed (18 checks). The modified TypeScript modules also passed an isolated strict typecheck against the renderer's public signatures.
- Non-target boss plans were compared against v1.12.59, including Kernel Panic: unchanged. Shared damage budgets are preserved.
- This is not a full production build or an in-game visual certification. Other animation/assets, Medusa summon-limit interactions, and action-mode pattern visuals remain to be validated; they are not claimed fixed by this release.

## 1.12.59 - 2026-10-23

### Fixed
- Carnivorous Queen (World 5): her regular acid move now also creates two visibly warned rows of persistent thorn-vine walls with alternating safe openings in On Call/Sprints.
- Tactical final Queen: her root signature additionally creates paired vine-wall segments with distinct safe gaps.
- Existing thorn projectiles, roots, boss attack damage rules and other bosses remain unchanged.

## 1.12.58 - 2026-10-23

### Fixed
- Tactical battle: the divider wall remains at the exact same row during preparation, combat and round results instead of sinking as the fight starts.
- Unit, board and other asset positions are unchanged.

## 1.12.57 - 2026-10-23

### Added
- Carnivorous Queen (World 5): staggered geometric thorn volleys with alternating escape corridors, alongside her existing roots. The extra pattern starts below half health in On Call/Sprints and accompanies her final-boss root cast on the tactical board.
- Shadow Wraith (World 8): three delayed ghost projectile fans arranged in a triangular attack pattern alongside its clone ability, in both action and tactical boss modes.
- Tactical boss projectiles now preserve individually staggered launch delays after their cast wind-up.

### Unchanged
- Kernel Panic's introductory difficulty and attacks.
- Existing boss damage budgets, other bosses' unique attacks, and all sprite assets.

## 1.12.56 - 2026-10-23

### Changed
- Carnivorous Queen: below half health, the root attack expands from three to five staggered lanes in On Call/Sprints. Tactical final-boss roots also expand to five staggered lanes.
- Shadow Wraith: clones add a aimed, dodgeable ghost projectile in On Call/Sprints. Tactical final-boss clones add a delayed targeted ghost strike.
- Kernel Panic and other boss kits remain unchanged.

## 1.12.55 - 2026-10-23

### Fixed
- Medusa (World 4) keeps the standard two-enemy backup summons on their existing schedule, but they appear as snakes rather than the Mud world's frogs.
- Medusa's separate snake-from-hair summons are unchanged: purple in phase 1, turquoise in phase 2, with the same timing and limits.

### Scope
- Other bosses' generic backup summons are unchanged.
- No sprite files or combat attack timings were changed.


